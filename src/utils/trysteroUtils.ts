import { joinRoom } from "trystero/torrent";

const config = { appId: "echomesh" };

export const createRoom = (roomId: string) => {
  const room = joinRoom(config, roomId);
  const [sendMessage, getMessage] = room.makeAction<string>("message");
  return { sendMessage, getMessage };
};

export const generateRoomId = () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(6)); // 6 bytes = 12 base36 chars
    const randomId = Array.from(randomBytes)
      .map((byte) => byte.toString(36).padStart(2, "0")) // Base36 encoding
      .join("")
      .slice(0, 12); // Ensure exactly 12 chars
  
    return `room-${randomId}`;
  };
  
  
  