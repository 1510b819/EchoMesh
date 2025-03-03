export const isValidRoomId = (roomId: string) => {
    return /^room-[a-z0-9]{12}$/.test(roomId); // Matches "room-xxxxxxxxxxxx" (12 lowercase alphanumeric chars)
  };
  
  export const handleJoinRoom = (
    newRoomId: string,
    setRoomId: (id: string) => void,
    setMessages: (messages: []) => void,
    setCustomRoom: (room: string) => void
  ) => {
    if (!newRoomId.trim()) return; // Prevent empty input
  
    if (!isValidRoomId(newRoomId)) {
      console.warn("Invalid Room ID! Only secure room IDs are allowed.");
      return;
    }
  
    setRoomId(newRoomId);
    setMessages([]); // Clear messages when switching rooms
    setCustomRoom(""); // Clear input after joining
  };
  
  