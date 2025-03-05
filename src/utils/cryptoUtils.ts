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

// 📌 Derive Secure Key from Password & Room ID
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

// 📌 Encrypt a Message using XChaCha20-Poly1305
export const encryptMessage = async (message: string, key: Uint8Array): Promise<string> => {
  await sodium.ready;

  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES); // Generate a random nonce
  const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    encodeText(message), // Message to encrypt
    null, // No additional authenticated data (AAD)
    null, // No secret nonce
    nonce,
    key
  );

  return `${arrayBufferToBase64(nonce)}:${arrayBufferToBase64(encrypted)}`;
};

// 📌 Decrypt a Message using XChaCha20-Poly1305
export const decryptMessage = async (ciphertext: string, key: Uint8Array): Promise<string> => {
  try {
    await sodium.ready;

    const [nonceB64, encryptedB64] = ciphertext.split(":");
    if (!nonceB64 || !encryptedB64) throw new Error("❌ Invalid ciphertext format");

    const nonce = base64ToArrayBuffer(nonceB64);
    const encrypted = base64ToArrayBuffer(encryptedB64);
    const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null, // No additional authenticated data (AAD)
      encrypted,
      null, // No secret nonce
      nonce,
      key
    );

    return decodeText(decrypted);
  } catch (error) {
    console.error("❌ Decryption failed:", error);
    return "[Decryption Error]";
  }
};
