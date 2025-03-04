import sodium from "libsodium-wrappers";

// Ensure libsodium is initialized before usage
const initSodium = async () => {
  await sodium.ready;
};

// Text Encoding & Decoding
export const encodeText = (text: string): Uint8Array => new TextEncoder().encode(text);
export const decodeText = (buffer: Uint8Array): string => new TextDecoder().decode(buffer);

// Base64 Encoding/Decoding (Compatible with Old Code)
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

export const base64ToArrayBuffer = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes; // ✅ Returns Uint8Array
};

// Derive a Secure Encryption Key from Password & Room ID
export const deriveKeyFromPassword = async (password: string, roomID: string): Promise<Uint8Array> => {
  await initSodium();

  const salt = sodium.crypto_generichash(16, sodium.from_string(roomID)); // 16-byte salt
  return sodium.crypto_pwhash(
    32, // 32-byte key for XChaCha20-Poly1305
    password,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
};

// Encrypt a Message using XChaCha20-Poly1305
export const encryptMessage = async (message: string, key: Uint8Array): Promise<string> => {
  await initSodium();

  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES); // Generate random nonce
  const messageUint8 = sodium.from_string(message); // Convert message to Uint8Array

  const encrypted = sodium.crypto_secretbox_easy(messageUint8, nonce, key); // Encrypt

  // Encode nonce + ciphertext as base64 (colon-separated for compatibility)
  return `${sodium.to_base64(nonce)}:${sodium.to_base64(encrypted)}`;
};

// Decrypt a Message
export const decryptMessage = async (ciphertext: string, key: Uint8Array): Promise<string> => {
  try {
    await initSodium();

    const [nonceB64, encryptedB64] = ciphertext.split(":");
    if (!nonceB64 || !encryptedB64) throw new Error("Invalid ciphertext format");

    const nonce = sodium.from_base64(nonceB64);
    const encrypted = sodium.from_base64(encryptedB64);

    const decrypted = sodium.crypto_secretbox_open_easy(encrypted, nonce, key);
    return sodium.to_string(decrypted); // Convert Uint8Array back to string
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Decryption Error]";
  }
};
