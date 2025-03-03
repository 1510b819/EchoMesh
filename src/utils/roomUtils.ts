export const generateRoomId = () => {
    return crypto.getRandomValues(new Uint8Array(16))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, "0"), "");
  };
  
  export const isValidRoomId = (roomId: string) => {
    return /^[0-9a-f]{32}$/.test(roomId); // Ensures 32-character lowercase hex string
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
  