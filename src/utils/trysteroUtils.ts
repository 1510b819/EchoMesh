import { joinRoom } from "trystero/torrent";

const config = { appId: "echomesh" };

/**
 * Create a secure chat room using Trystero
 */
export const createRoom = (roomId: string) => {
  const room = joinRoom(config, roomId);
  const [sendMessage, getMessage] = room.makeAction<string>("message");
  return { sendMessage, getMessage };
};

/**
 * Generate a cryptographically secure room ID and password
 */
export const generateRoomId = () => {
  const generateSecureString = (length: number, chars: string) => {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes)
      .map((byte) => chars[byte % chars.length])
      .join("");
  };

  // Generate a **stronger** room ID (20 lowercase alphanumeric characters)
  const roomId = generateSecureString(20, "abcdefghijklmnopqrstuvwxyz0123456789");

  // Generate a **strong password** (32 characters, includes symbols)
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const password = generateSecureString(32, chars);

  return { id: `room-${roomId}`, password };
};