import React, { useState, useEffect, useCallback, useRef } from "react";
import { deriveKeyFromRoom, encryptMessage, decryptMessage } from "../utils/cryptoUtils";
import { createRoom, generateRoomId } from "../utils/trysteroUtils";
import { handleCommand } from "../utils/commands";

const nordTheme = {
  background: "#2E3440",
  text: "#D8DEE9",
  inputBg: "#3B4252",
  border: "#4C566A",
  sender: "#81A1C1",
  receiver: "#88C0D0",
  accent: "#5E81AC",
};

type Message = {
  text: string;
  sender: string;
  timestamp: number;
};

const Chat = () => {
  const [roomId, setRoomId] = useState<string>(() => localStorage.getItem("echomesh-room") || generateRoomId());
  const [messages, setMessages] = useState<Message[]>([]); // ✅ Ensuring messages have timestamps
  const [message, setMessage] = useState<string>("");
  const [customRoom, setCustomRoom] = useState<string>("");
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [lastMessageTime, setLastMessageTime] = useState(0);
  const messageCooldown = 1000; // 1 second cooldown
  const messageLifetime = 60 * 60 * 1000; // 1 hour

  useEffect(() => {
    localStorage.setItem("echomesh-room", roomId);
    deriveKeyFromRoom(roomId).then(setEncryptionKey).catch((err) => console.error("Key derivation failed:", err));
  }, [roomId]);

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setMessages((prev) => prev.filter((msg) => Date.now() - msg.timestamp < messageLifetime));
    }, 60000); // Run every 60 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  const { sendMessage, getMessage } = createRoom(roomId);

  useEffect(() => {
    if (!encryptionKey) return;

    getMessage(async (encryptedMsg, peerId) => {
      const decryptedMsg = await decryptMessage(encryptedMsg, encryptionKey);
      setMessages((prev) => [...prev, { text: decryptedMsg, sender: peerId, timestamp: Date.now() }]); // ✅ Added timestamp
    });
  }, [encryptionKey]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  const handleSend = useCallback(async () => {
    const now = Date.now();

    if (now - lastMessageTime < messageCooldown) {
      console.warn("You're sending messages too fast! Slow down.");
      return;
    }

    if (!message.trim()) return;

    setLastMessageTime(now);

    if (message.startsWith("/")) {
      handleCommand({ message, roomId, setRoomId, setMessages, setMessage }); // Ensure handleCommand supports timestamps
      setMessage("");
      return;
    }

    if (!encryptionKey) {
      console.error("Encryption key not available");
      return;
    }

    try {
      const encryptedMsg = await encryptMessage(message, encryptionKey);
      sendMessage(encryptedMsg);
      setMessages((prev) => [...prev, { text: message, sender: "Me", timestamp: now }]); // ✅ Ensuring timestamp is set
      setMessage("");
    } catch (error) {
      console.error("Message encryption failed:", error);
    }
  }, [message, encryptionKey, roomId, lastMessageTime]);

  const isValidRoomId = (roomId: string) => {
    return /^[0-9a-f]{32}$/.test(roomId); // Ensures 32 lowercase hex characters
  };
  
  const handleJoinRoom = useCallback((newRoomId: string) => {
    if (!newRoomId.trim()) return; // Prevent empty input
  
    if (!isValidRoomId(newRoomId)) {
      console.warn("Invalid Room ID! Only secure room IDs are allowed.");
      return;
    }
  
    setRoomId(newRoomId);
    setMessages([]); // Clear messages when switching rooms
    setCustomRoom(""); // Clear input after joining
  }, []);
  
  
  

  return (
    <div
      style={{
        background: nordTheme.background,
        color: nordTheme.text,
        fontFamily: "monospace",
        padding: "20px",
        width: "450px",
        borderRadius: "6px",
        border: `1px solid ${nordTheme.border}`,
        boxShadow: `0 0 8px rgba(0, 0, 0, 0.2)`,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", borderBottom: `1px solid ${nordTheme.border}`, paddingBottom: "5px" }}>
        <h3 style={{ margin: 0, color: nordTheme.accent }}>EchoMesh</h3>
        <small style={{ color: nordTheme.sender }}>Room: {roomId}</small>
      </div>

      {/* Room Controls */}
<div style={{ display: "flex", gap: "5px" }}>
  {/* Input for entering a room ID */}
  <input
    type="text"
    value={customRoom}
    onChange={(e) => setCustomRoom(e.target.value)}
    placeholder="Enter Room ID..."
    style={{
      flex: 2,
      background: nordTheme.inputBg,
      color: nordTheme.text,
      border: `1px solid ${nordTheme.border}`,
      padding: "6px",
      fontFamily: "monospace",
    }}
  />
  {/* Join Existing Room */}
  <button
    onClick={() => handleJoinRoom(customRoom)}
    style={{
      background: nordTheme.receiver,
      color: "#2E3440",
      padding: "6px",
      border: "none",
      cursor: "pointer",
      flex: 1,
    }}
    disabled={!customRoom.trim()} // Disable if input is empty
  >
    Join Room
  </button>
  {/* Create New Secure Room */}
  <button
    onClick={() => handleJoinRoom(generateRoomId())}
    style={{
      background: nordTheme.sender,
      color: "#2E3440",
      padding: "6px",
      border: "none",
      cursor: "pointer",
      flex: 1,
    }}
  >
    New Room
  </button>
</div>


      {/* Message Display */}
      <div
        style={{
          border: `1px solid ${nordTheme.border}`,
          padding: "10px",
          height: "250px",
          overflowY: "auto",
          background: nordTheme.inputBg,
          borderRadius: "5px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ display: "flex", justifyContent: msg.sender === "Me" ? "flex-end" : "flex-start" }}>
            <p
              style={{
                background: msg.sender === "Me" ? nordTheme.sender : nordTheme.receiver,
                color: nordTheme.background,
                padding: "6px 10px",
                borderRadius: "5px",
                maxWidth: "75%",
                fontSize: "14px",
                margin: "2px 0",
              }}
            >
              <strong>{msg.sender}:</strong> {msg.text}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Message Input */}
      <div style={{ display: "flex", gap: "5px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="> Type a message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{
            flex: 1,
            background: nordTheme.inputBg,
            color: nordTheme.text,
            border: `1px solid ${nordTheme.border}`,
            padding: "6px",
            fontFamily: "monospace",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            background: nordTheme.sender,
            color: "#2E3440",
            padding: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
