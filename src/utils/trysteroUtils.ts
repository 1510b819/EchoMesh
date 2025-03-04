import { joinRoom } from "trystero/torrent";

const config = { appId: "echomesh" };

export const createRoom = (roomId: string) => {
  const room = joinRoom(config, roomId);
  const [sendMessage, getMessage] = room.makeAction<string>("message");
  return { sendMessage, getMessage };
};


export const generateRoomId = () => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(6));
  const randomId = Array.from(randomBytes)
    .map((byte) => byte.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 12);

  // Generate a more secure password (16 chars, using A-Z, a-z, 0-9, symbols)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const passwordBytes = crypto.getRandomValues(new Uint8Array(16));
  const password = Array.from(passwordBytes)
    .map((byte) => chars[byte % chars.length]) // Ensure valid character selection
    .join("");

  const newRoom = { id: `room-${randomId}`, password };

  sessionStorage.setItem("echomesh-room-password", password); // Store password for creator

  return newRoom;
};
