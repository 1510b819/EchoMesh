import { useState, useEffect, useRef } from "react";
import { deriveKeyFromRoom, decryptMessage } from "../utils/cryptoUtils";
import { createRoom, generateRoomId } from "../utils/trysteroUtils";
import { handleJoinRoom } from "../utils/roomUtils";
import { handleSend } from "../utils/messageUtils";

// Import the CSS file
import './Chat.css';

type Message = {
  text: string;
  sender: string;
  timestamp: number;
};

const Chat = () => {
  const [roomId, setRoomId] = useState<string>(() => sessionStorage.getItem("echomesh-room") || generateRoomId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");
  const [customRoom, setCustomRoom] = useState<string>("");
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [lastMessageTime, setLastMessageTime] = useState(0);
  const messageCooldown = 1000; // 1-second cooldown
  const messageLifetime = 60 * 60 * 1000; // 1 hour

  useEffect(() => {
    sessionStorage.setItem("echomesh-room", roomId);
    deriveKeyFromRoom(roomId)
      .then(setEncryptionKey)
      .catch((err) => console.error("Key derivation failed:", err));
  }, [roomId]);

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setMessages((prev) => prev.filter((msg) => Date.now() - msg.timestamp < messageLifetime));
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const { sendMessage, getMessage } = createRoom(roomId);

  useEffect(() => {
    if (!encryptionKey) return;

    getMessage(async (encryptedMsg, peerId) => {
      const decryptedMsg = await decryptMessage(encryptedMsg, encryptionKey);
      setMessages((prev) => [...prev, { text: decryptedMsg, sender: peerId, timestamp: Date.now() }]);
    });
  }, [encryptionKey]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <h3>EchoMesh</h3>
        <small 
          onClick={() => {
            navigator.clipboard.writeText(roomId);
            alert("Room ID copied to clipboard!");
          }}
        >
          Room: {roomId}
        </small>
      </div>

      {/* Room Controls */}
      <div className="room-controls">
        <input
          ref={inputRef}
          type="text"
          value={customRoom}
          onChange={(e) => setCustomRoom(e.target.value)}
          placeholder="Enter Room ID..."
        />
        <button
          onClick={() => handleJoinRoom(customRoom, setRoomId, setMessages, setCustomRoom)}
          disabled={!customRoom.trim()}
        >
          Join
        </button>
        <button
          onClick={() => handleJoinRoom(generateRoomId(), setRoomId, setMessages, setCustomRoom)}
        >
          New
        </button>
      </div>

      {/* Message Display */}
      <div className="message-display">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === "Me" ? "me" : ""}`}>
            <p>
              <strong>{msg.sender}:</strong> {msg.text}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Message Input */}
      <div className="message-input">
        <input
          ref={inputRef}  
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="> Type a message..."
          onKeyDown={(e) =>
            e.key === "Enter" &&
            handleSend(
              message,
              roomId,
              encryptionKey,
              sendMessage,
              setMessages,
              setMessage,
              lastMessageTime,
              setLastMessageTime,
              messageCooldown
            )
          }
        />
        <button
          onClick={() =>
            handleSend(
              message,
              roomId,
              encryptionKey,
              sendMessage,
              setMessages,
              setMessage,
              lastMessageTime,
              setLastMessageTime,
              messageCooldown
            )
          }
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
