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

  const passwordBytes = crypto.getRandomValues(new Uint8Array(4));
  const password = Array.from(passwordBytes)
    .map((byte) => (byte % 36).toString(36)) // Convert to alphanumeric
    .join("")
    .slice(0, 6); // 6-character password

  const newRoom = { id: `room-${randomId}`, password };
  
  sessionStorage.setItem("echomesh-room-password", password); // Store password for creator

  return newRoom;
};

  
  
  