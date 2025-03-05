export const isValidRoomId = (roomId: string) => {
  return /^room-[a-z0-9]{12}$/.test(roomId); // Matches "room-xxxxxxxxxxxx" (12 lowercase alphanumeric chars)
};

// Updated handleJoinRoom, no password parameter anymore
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

  const enteredPassword = prompt("Enter the room password:");

  if (!enteredPassword) {
    alert("Password is required to join this room.");
    return;
  }

  setRoomData({ id: newRoomId, password: enteredPassword });
  sessionStorage.setItem("echomesh-room", newRoomId);
  sessionStorage.setItem("echomesh-room-password", enteredPassword);

  setMessages([]); // Clear messages when switching rooms
  setCustomRoom("");
};
