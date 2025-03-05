export const isValidRoomId = (roomId: string) => {
  return /^room-[a-z0-9]{12}$/.test(roomId); // Matches "room-xxxxxxxxxxxx" (12 lowercase alphanumeric chars)
};
//join room
export const handleJoinRoom = (
  newRoomId: string,
  setRoomData: (room: { id: string; password: string }) => void,
  setMessages: (messages: []) => void,
  setCustomRoom: (room: string) => void
) => {
  if (!newRoomId.trim()) return;

  if (!isValidRoomId(newRoomId)) {
    console.warn("Invalid Room ID! Only secure room IDs are allowed.");
    return;
  }

  // Proceed to show the password modal (don't ask for password here)
  setRoomData({ id: newRoomId, password: "" });  // Reset password in state
  setMessages([]); // Clear messages when switching rooms
  setCustomRoom("");
};

