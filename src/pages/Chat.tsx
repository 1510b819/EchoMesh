import { useState, useEffect, useRef, useCallback } from "react";
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

const messageLifetime = 60 * 60 * 1000; // 1 hour
const messageCooldown = 1000; // 1-second cooldown

const Chat = () => {
  const [roomData, setRoomData] = useState(() => {
    const storedRoom = sessionStorage.getItem("echomesh-room");
    const storedPassword = sessionStorage.getItem("echomesh-room-password");
    return storedRoom
      ? { id: storedRoom, password: storedPassword || "" }
      : generateRoomId();
  });
  
  // ✅ Function to update only the room ID
  const setRoomId = (newRoomId: string) => {
    setRoomData((prev) => ({ ...prev, id: newRoomId }));
  };
  

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [customRoom, setCustomRoom] = useState("");
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { sendMessage, getMessage } = createRoom(roomData.id);

  useEffect(() => {
    sessionStorage.setItem("echomesh-room", roomData.id);
    sessionStorage.setItem("echomesh-room-password", roomData.password);

    deriveKeyFromRoom(roomData.id)
      .then(setEncryptionKey)
      .catch(console.error);
  }, [roomData]);

  useEffect(() => {
    const cleanupMessages = () => {
      setMessages((prev) => prev.filter((msg) => Date.now() - msg.timestamp < messageLifetime));
    };

    const cleanupInterval = setInterval(cleanupMessages, 60000);
    return () => clearInterval(cleanupInterval);
  }, []);

  useEffect(() => {
    if (!encryptionKey) return;

    getMessage(async (encryptedMsg, peerId) => {
      const decryptedMsg = await decryptMessage(encryptedMsg, encryptionKey);
      setMessages((prev) => [...prev, { text: decryptedMsg, sender: peerId, timestamp: Date.now() }]);
    });
  }, [encryptionKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleRoomJoin = useCallback(
    (room: string) => handleJoinRoom(room, setRoomData, setMessages, setCustomRoom),
    []
  );

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <h3>EchoMesh</h3>
        <small 
          onClick={() => {
            navigator.clipboard.writeText(`${roomData.id} (Password: ${roomData.password})`);
            alert("Room ID and password copied to clipboard!");
          }}
        >
          Room: {roomData.id} <br />
          Password: {roomData.password}
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
        <button onClick={() => handleRoomJoin(customRoom)} disabled={!customRoom.trim()}>
          Join
        </button>
        <button
          onClick={() => {
            const newRoom = generateRoomId();
            setRoomData(newRoom);
            sessionStorage.setItem("echomesh-room", newRoom.id);
            sessionStorage.setItem("echomesh-room-password", newRoom.password);
            alert(`New room created!\nRoom ID: ${newRoom.id}\nPassword: ${newRoom.password}`);
          }}
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
              roomData.id,
              encryptionKey,
              sendMessage,
              setRoomId,
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
              roomData.id,
              encryptionKey,
              sendMessage,
              setRoomId,
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
