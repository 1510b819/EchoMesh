import sodium from "libsodium-wrappers-sumo"; // ✅ Load all Libsodium functions

// ✅ Initialize Sodium Once
const initSodium = async () => {
  await sodium.ready;
  console.log("🔹 Sodium is ready!");

  if (!sodium.crypto_pwhash) {
    console.error("❌ crypto_pwhash function is unavailable. Check Libsodium import.");
  }
};

initSodium(); // Load sodium at startup

// 📌 Encode & Decode Text
export const encodeText = (text: string): Uint8Array => new TextEncoder().encode(text);
export const decodeText = (buffer: Uint8Array): string => new TextDecoder().decode(buffer);

// 📌 Base64 Encoding/Decoding
export const arrayBufferToBase64 = (buffer: Uint8Array): string =>
  sodium.to_base64(buffer, sodium.base64_variants.ORIGINAL);

export const base64ToArrayBuffer = (base64: string): Uint8Array =>
  sodium.from_base64(base64, sodium.base64_variants.ORIGINAL);

// 📌 Derive Secure Key from Password & Room ID (For Diffie-Hellman Key Exchange)
export const deriveKeyFromPassword = async (password: string, roomID: string): Promise<Uint8Array> => {
  await sodium.ready;

  if (!password) throw new Error("❌ Password is required for key derivation");

  const salt = sodium.crypto_generichash(16, sodium.from_string(roomID)); // 16-byte salt

  return sodium.crypto_pwhash(
    32, // ✅ 32-byte key for XChaCha20-Poly1305
    sodium.from_string(password),
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE, // 🔹 Stronger key stretching
    sodium.crypto_pwhash_MEMLIMIT_MODERATE, // 🔹 More resistant to brute-force
    sodium.crypto_pwhash_ALG_DEFAULT
  );
};

// 📌 Derive Diffie-Hellman Key Pair from Room ID and Password
export const deriveDiffieHellmanKeyPair = async (roomID: string, password: string): Promise<{
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}> => {
  await sodium.ready;

  // Combine room ID and password into one string and hash it for determinism
  const keySeed = sodium.crypto_generichash(32, sodium.from_string(roomID + password));

  // Use the hashed result to generate a Diffie-Hellman private key
  const privateKey = keySeed;  // We use the hash as the private key directly

  // Generate the public key using crypto_scalarmult_base (base point multiplication)
  const publicKey = sodium.crypto_scalarmult_base(privateKey);

  return { privateKey, publicKey };
};

// 📌 Derive Shared Secret using Diffie-Hellman
export const deriveSharedSecret = async (
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Promise<Uint8Array> => {
  await sodium.ready;
  const sharedSecret = sodium.crypto_scalarmult(privateKey, publicKey); // Derive shared secret using Diffie-Hellman
  return sharedSecret;
};

// 📌 Combine Diffie-Hellman Shared Secret and Password-Based Key
export const combineKeysForEncryption = async (
  password: string,
  roomID: string,
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Promise<Uint8Array> => {
  const passwordDerivedKey = await deriveKeyFromPassword(password, roomID); // Derive key from password
  const sharedSecret = await deriveSharedSecret(privateKey, publicKey); // Derive shared secret

  // Manually combine the password-derived key and the Diffie-Hellman shared secret
  const combinedKey = new Uint8Array(passwordDerivedKey.length + sharedSecret.length);
  
  // Copy both arrays into the combined array
  combinedKey.set(passwordDerivedKey, 0);  // Copy the password-derived key
  combinedKey.set(sharedSecret, passwordDerivedKey.length);  // Copy the shared secret

  // Use a hash to ensure the final key has the correct size
  const finalKey = sodium.crypto_generichash(32, combinedKey); // 32-byte hash for final encryption key
  console.log("🔑 Combined encryption key:", finalKey);
  return finalKey;
};
const seenNonces = new Set<string>();
let nonceCounter = 0;  // Ensure nonces are unique across sessions

const generateNonce = (): Uint8Array => {
  let nonce;
  do {
    nonce = new Uint8Array(24);
    crypto.getRandomValues(nonce);
    
    // Include a counter to ensure uniqueness across sessions
    const counterBytes = new TextEncoder().encode(nonceCounter.toString());
    nonce.set(counterBytes.slice(0, Math.min(24, counterBytes.length)), 0);

    nonceCounter++;  // Increment counter
  } while (seenNonces.has(sodium.to_hex(nonce)));  // 🔹 Use sodium.to_hex()

  // Store nonce in seenNonces to prevent reuse
  seenNonces.add(sodium.to_hex(nonce));  // 🔹 Use sodium.to_hex()

  // Trim set size to prevent memory leak
  if (seenNonces.size > 1000) {
    seenNonces.clear();
  }

  return nonce;
};


export const encryptMessage = async (message: string, key: Uint8Array): Promise<string> => {
  await sodium.ready;

  const nonce = generateNonce(); // ✅ Proper 24-byte nonce

  const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    encodeText(message), // Message to encrypt
    null, // No additional authenticated data (AAD)
    null, // No secret nonce
    nonce, // ✅ Proper nonce
    key
  );

  // Compute HMAC for integrity check
  const hmac = sodium.crypto_generichash(32, encrypted, key);

  return `${arrayBufferToBase64(nonce)}:${arrayBufferToBase64(encrypted)}:${arrayBufferToBase64(hmac)}`;
};


export const decryptMessage = async (ciphertext: string, key: Uint8Array, seenNonces: Set<string>): Promise<string> => {
  await sodium.ready;

  const [nonceB64, encryptedB64, hmacB64] = ciphertext.split(":");
  if (!nonceB64 || !encryptedB64 || !hmacB64) throw new Error("Invalid ciphertext format");

  const nonce = base64ToArrayBuffer(nonceB64);
  if (nonce.length !== 24) throw new Error("Invalid nonce length!"); // ✅ Extra validation

  const encrypted = base64ToArrayBuffer(encryptedB64);
  const receivedHmac = base64ToArrayBuffer(hmacB64);

  // Prevent replay attacks
  const nonceStr = arrayBufferToBase64(nonce); // Encode as base64
  if (seenNonces.has(nonceStr)) throw new Error("Replay attack detected!");
  seenNonces.add(nonceStr);

  // Validate HMAC
  const computedHmac = sodium.crypto_generichash(32, encrypted, key);
  if (!sodium.memcmp(receivedHmac, computedHmac)) {
    throw new Error("Message authentication failed!");
  }

  const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null, // No additional authenticated data
    encrypted,
    null,
    nonce,
    key
  );

  return decodeText(decrypted);
};
