/**
 * Validate if a room ID is properly formatted
 * Now enforces 20-character room IDs for stronger security
 */
export const isValidRoomId = (roomId: string) => {
  return /^room-[a-z0-9]{20}$/.test(roomId); // ✅ Updated to match the new stronger 20-char room ID format
};

/**
 * Handles the process of joining a room securely
 */
export const handleJoinRoom = (
  newRoomId: string,
  setRoomData: (room: { id: string; password: string }) => void,
  setMessages: (messages: []) => void,
  setCustomRoom: (room: string) => void
) => {
  if (!newRoomId.trim()) {
    console.warn("Attempted to join an empty room ID.");
    return;
  }

  if (!isValidRoomId(newRoomId)) {
    console.warn("Invalid Room ID! Only secure room IDs are allowed.");
    return;
  }

  // Ensure the state is cleared before joining a new room
  setRoomData({ id: newRoomId, password: "" }); // ✅ Password remains unset until verified
  setMessages([]); // ✅ Clear previous messages to prevent data leakage
  setCustomRoom(""); // ✅ Reset any previous custom room selection

  console.log(`Joining room: ${newRoomId}`);
};
