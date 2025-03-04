import sodium from "libsodium-wrappers";

// ✅ Initialize Sodium Once
const initSodium = async () => {
  await sodium.ready; 
  console.log("🔹 Sodium is ready!", sodium);
};

initSodium(); // 🚀 Load sodium at startup

// 📌 Text Encoding & Decoding
export const encodeText = (text: string): Uint8Array => new TextEncoder().encode(text);
export const decodeText = (buffer: Uint8Array): string => new TextDecoder().decode(buffer);

// 📌 Base64 Encoding/Decoding
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

export const base64ToArrayBuffer = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  return new Uint8Array([...binaryString].map(char => char.charCodeAt(0))); // ✅ Optimized
};

// 📌 Derive a Secure Encryption Key from Password & Room ID
export const deriveKeyFromPassword = async (password: string, roomID: string): Promise<Uint8Array> => {
  await sodium.ready; // ✅ Ensure sodium is initialized
  if (!password) throw new Error("Password is required for key derivation");

  const salt = sodium.crypto_generichash(16, sodium.from_string(roomID)); // 16-byte salt
  return sodium.crypto_pwhash(
    32, // 32-byte key for XChaCha20-Poly1305
    sodium.from_string(password),
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE, 
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
};

// 📌 Encrypt a Message using XChaCha20-Poly1305
export const encryptMessage = async (message: string, key: Uint8Array): Promise<string> => {
  await sodium.ready; // ✅ Ensures sodium is loaded

  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES); // Random nonce
  const encrypted = sodium.crypto_secretbox_easy(sodium.from_string(message), nonce, key);

  return `${sodium.to_base64(nonce)}:${sodium.to_base64(encrypted)}`; // ✅ Return nonce + ciphertext
};

// 📌 Decrypt a Message using XChaCha20-Poly1305
export const decryptMessage = async (ciphertext: string, key: Uint8Array): Promise<string> => {
  try {
    await sodium.ready;

    const [nonceB64, encryptedB64] = ciphertext.split(":");
    if (!nonceB64 || !encryptedB64) throw new Error("Invalid ciphertext format");

    const nonce = sodium.from_base64(nonceB64);
    const encrypted = sodium.from_base64(encryptedB64);
    const decrypted = sodium.crypto_secretbox_open_easy(encrypted, nonce, key);

    return sodium.to_string(decrypted); // ✅ Convert Uint8Array back to string
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Decryption Error]"; // ✅ Prevents crashes
  }
};
