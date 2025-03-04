export const encodeText = (text: string) => new TextEncoder().encode(text);

export const arrayBufferToBase64 = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

export const base64ToArrayBuffer = (base64: string) =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

export const deriveKeyFromPassword = async (password: string, roomID: string) => {
  const encoder = new TextEncoder();
  const salt = encoder.encode(roomID); // Use room ID as salt
  const info = encoder.encode("EchoMesh Encryption"); // Context-specific info

  // Import the password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" }, // Use HMAC for HKDF
    false,
    ["sign"]
  );

  // Derive a strong encryption key using HKDF
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info,
    },
    keyMaterial,
    256 // Output 256-bit key
  );

  // Import the derived key for AES-GCM encryption
  return await crypto.subtle.importKey(
    "raw",
    derivedBits,
    { name: "AES-GCM", length: 256 },
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
