import { joinRoom } from "trystero/torrent";

const config = { appId: "echomesh" };

export const createRoom = (roomId: string) => {
  const room = joinRoom(config, roomId);
  const [sendMessage, getMessage] = room.makeAction<string>("message");
  return { sendMessage, getMessage };
};

// Generate a unique room ID if none exists
export const generateRoomId = () => `room-${Math.random().toString(36).substring(2, 10)}`;
