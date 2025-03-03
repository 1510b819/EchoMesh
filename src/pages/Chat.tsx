import React, { useState, useEffect, useCallback, useRef } from "react";
import { deriveKeyFromRoom, encryptMessage, decryptMessage } from "../utils/cryptoUtils";
import { createRoom, generateRoomId } from "../utils/trysteroUtils";
import { handleCommand } from "../utils/commands"; // Import the command handler

const nordTheme = {
  background: "#2E3440",
  text: "#D8DEE9",
  inputBg: "#3B4252",
  border: "#4C566A",
  sender: "#81A1C1",
  receiver: "#88C0D0"
};

const Chat = () => {
  const [roomId, setRoomId] = useState<string>(() => localStorage.getItem("echomesh-room") || generateRoomId());
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [message, setMessage] = useState<string>("");
  const [customRoom, setCustomRoom] = useState<string>("");
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem("echomesh-room", roomId);
    deriveKeyFromRoom(roomId).then(setEncryptionKey);
  }, [roomId]);

  const { sendMessage, getMessage } = createRoom(roomId);

  useEffect(() => {
    if (!encryptionKey) return;

    getMessage(async (encryptedMsg, peerId) => {
      const decryptedMsg = await decryptMessage(encryptedMsg, encryptionKey);
      setMessages((prev) => [...prev, { text: decryptedMsg, sender: peerId }]);
    });
  }, [encryptionKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!message.trim()) return;
  
    // Check if it's a command
    if (message.startsWith("/")) {
      handleCommand({ message, roomId, setRoomId, setMessages, setMessage });
      return;
    }
  
    // Normal Message Handling
    if (encryptionKey) {
      const encryptedMsg = await encryptMessage(message, encryptionKey);
      sendMessage(encryptedMsg);
      setMessages((prev) => [...prev, { text: message, sender: "Me" }]);
      setMessage("");
    }
  }, [message, encryptionKey, roomId]);
  

  const handleJoinRoom = () => {
    if (customRoom.trim()) {
      setRoomId(customRoom);
      setMessages([]);
    }
  };

  return (
    <div style={{ background: nordTheme.background, color: nordTheme.text, fontFamily: "monospace", padding: "20px", width: "400px", borderRadius: "8px", border: `2px solid ${nordTheme.border}` }}>
      <h2 style={{ textAlign: "center" }}>EchoMesh</h2>
      <p style={{ textAlign: "center", color: nordTheme.sender }}>Room: {roomId}</p>

      <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
        <input
          type="text"
          value={customRoom}
          onChange={(e) => setCustomRoom(e.target.value)}
          placeholder="Enter room name..."
          style={{ flex: 1, background: nordTheme.inputBg, color: nordTheme.text, border: `1px solid ${nordTheme.border}`, padding: "5px" }}
        />
        <button onClick={handleJoinRoom} style={{ background: nordTheme.sender, color: "#2E3440", padding: "5px" }}>Join</button>
      </div>

      <div style={{ border: `1px solid ${nordTheme.border}`, padding: "10px", height: "200px", overflowY: "auto", background: nordTheme.inputBg, borderRadius: "5px" }}>
        {messages.map((msg, index) => (
          <p key={index} style={{
            color: msg.sender === "Me" ? nordTheme.sender : nordTheme.receiver,
            textAlign: msg.sender === "Me" ? "right" : "left"
          }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </p>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{ flex: 1, background: nordTheme.inputBg, color: nordTheme.text, border: `1px solid ${nordTheme.border}`, padding: "5px" }}
        />
        <button onClick={handleSend} style={{ background: nordTheme.sender, color: "#2E3440", padding: "5px" }}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
