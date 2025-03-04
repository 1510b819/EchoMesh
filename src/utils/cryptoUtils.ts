export const encodeText = (text: string) => new TextEncoder().encode(text);

export const arrayBufferToBase64 = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

export const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes; // ✅ Correct type (Uint8Array)
};

export const deriveKeyFromPassword = async (password: string, roomID: string) => {
  const encoder = new TextEncoder();
  const salt = encoder.encode(roomID); // Use room ID as salt
  const info = encoder.encode("EchoMesh Encryption"); // Context-specific info

  // Import the password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HKDF" }, // ✅ Correct key import for HKDF
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive a strong encryption key using HKDF
  return await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 }, // ✅ Derive AES-GCM key directly
    false,
    ["encrypt", "decrypt"]
  );
};

// Encrypts a message with AES-GCM
export const encryptMessage = async (message: string, key: CryptoKey): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Generate IV
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodeText(message)
  );
  return `${arrayBufferToBase64(iv)}:${arrayBufferToBase64(encrypted)}`;
};

// Decrypts a message with AES-GCM
export const decryptMessage = async (ciphertext: string, key: CryptoKey): Promise<string> => {
  try {
    const [ivBase64, encryptedBase64] = ciphertext.split(":");
    const iv = base64ToArrayBuffer(ivBase64);
    const encrypted = base64ToArrayBuffer(encryptedBase64);

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed", error);
    return "[Decryption Error]";
  }
};
