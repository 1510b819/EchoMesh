import React, { useState, useEffect, useCallback } from "react";
import { deriveKeyFromRoom, encryptMessage, decryptMessage } from "../utils/cryptoUtils";
import { createRoom, generateRoomId } from "../utils/trysteroUtils";

const Chat = () => {
  const [roomId, setRoomId] = useState<string>(() => {
    return localStorage.getItem("echomesh-room") || generateRoomId();
  });

  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [message, setMessage] = useState<string>("");
  const [customRoom, setCustomRoom] = useState<string>("");
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);

  // Generate encryption key when room ID changes
  useEffect(() => {
    localStorage.setItem("echomesh-room", roomId);
    deriveKeyFromRoom(roomId).then(setEncryptionKey);
  }, [roomId]);

  const { sendMessage, getMessage } = createRoom(roomId);

  // Receive messages
  useEffect(() => {
    if (!encryptionKey) return;

    getMessage(async (encryptedMsg, peerId) => {
      const decryptedMsg = await decryptMessage(encryptedMsg, encryptionKey);
      setMessages((prev) => [...prev, { text: decryptedMsg, sender: peerId }]);
    });
  }, [encryptionKey]);

  // Send messages
  const handleSend = useCallback(async () => {
    if (message.trim() && encryptionKey) {
      const encryptedMsg = await encryptMessage(message, encryptionKey);
      sendMessage(encryptedMsg);
      setMessages((prev) => [...prev, { text: message, sender: "Me" }]);
      setMessage("");
    }
  }, [message, encryptionKey]);

  // Join a new room
  const handleJoinRoom = () => {
    if (customRoom.trim()) {
      setRoomId(customRoom);
      setMessages([]); // Clear previous messages
    }
  };

  return (
    <div>
      <h2>Current Room: {roomId}</h2>

      {/* Room Input */}
      <input
        type="text"
        value={customRoom}
        onChange={(e) => setCustomRoom(e.target.value)}
        placeholder="Enter room name to join..."
      />
      <button onClick={handleJoinRoom}>Join Room</button>

      {/* Messages */}
      <div style={{ border: "1px solid #ccc", padding: "10px", height: "200px", overflowY: "scroll" }}>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sender}:</strong> {msg.text}
          </p>
        ))}
      </div>

      {/* Message Input */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
};

export default Chat;
