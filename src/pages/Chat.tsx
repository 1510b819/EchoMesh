import { useState, useEffect, useRef, useCallback } from "react";
import { deriveKeyFromPassword, decryptMessage } from "../utils/cryptoUtils";
import { createRoom, generateRoomId } from "../utils/trysteroUtils";
import { handleJoinRoom } from "../utils/roomUtils";
import { handleSend } from "../utils/messageUtils";
import DOMPurify from "dompurify";

// Import the CSS file
import "./Chat.css";

const encodePassword = (password: string) => btoa(password); // Simple obfuscation
const decodePassword = (encoded: string) => {
  try {
    return atob(encoded);
  } catch {
    return ""; // Prevent errors if invalid
  }
};

type Message = {
  text: string;
  sender: string;
  timestamp: number;
};

const MESSAGE_LIFETIME = 60 * 60 * 1000; // 1 hour
const MESSAGE_COOLDOWN = 1000; // 1-second cooldown

const Chat = () => {
  const [roomData, setRoomData] = useState(() => {
    const storedRoom = sessionStorage.getItem("echomesh-room");
    return storedRoom ? { id: storedRoom, password: "" } : generateRoomId();
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [customRoom, setCustomRoom] = useState("");
  const [obfuscatedPassword, setObfuscatedPassword] = useState(""); // Obfuscated password for UI
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const { sendMessage, getMessage } = createRoom(roomData.id);

  useEffect(() => {
    if (!roomData.password) {
      setEncryptionKey(null);
      return;
    }
    deriveKeyFromPassword(roomData.password, roomData.id)
      .then(setEncryptionKey)
      .catch(console.error);
  }, [roomData.password, roomData.id]);

  useEffect(() => {
    const cleanupMessages = () => {
      setMessages((prev) => prev.filter((msg) => Date.now() - msg.timestamp < MESSAGE_LIFETIME));
    };
    const interval = setInterval(cleanupMessages, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!encryptionKey) return;
    const messageHandler = async (encryptedMsg: string, peerId: string) => {
      try {
        const decryptedMsg = await decryptMessage(encryptedMsg, encryptionKey);
        setMessages((prev) => [
          ...prev,
          { text: DOMPurify.sanitize(decryptedMsg), sender: peerId, timestamp: Date.now() },
        ]);
      } catch (error) {
        console.error("Message decryption failed:", error);
      }
    };
    getMessage(messageHandler);
  }, [encryptionKey, getMessage]);

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
      {/* 🔹 Header */}
      <div className="chat-header">
        <h3>EchoMesh</h3>
        <small>
          <span
            onClick={() => {
              navigator.clipboard.writeText(roomData.id);
              alert("Room ID copied to clipboard!");
            }}
            style={{ cursor: "pointer", textDecoration: "underline" }}
          >
            Room: {roomData.id}
          </span>
          <br />
          <span
            onClick={() => {
              const encoded = encodePassword(roomData.password);
              setObfuscatedPassword(encoded); // Store obfuscated version for UI
              navigator.clipboard.writeText(encoded);
              alert("Obfuscated Password copied to clipboard!");
            }}
            style={{ cursor: "pointer", textDecoration: "underline" }}
          >
            Password: {obfuscatedPassword || "********"}
          </span>
        </small>
      </div>

      {/* 🔹 Room Controls */}
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
            alert(`New room created!\nRoom ID: ${newRoom.id}\nObfuscated Password: ${encodePassword(newRoom.password)}\n\n⚠️ Please save this password!`);
          }}
        >
          New
        </button>
      </div>

      {/* 🔹 Password Input (Handles Paste) */}
      <div className="password-input">
        <input
          ref={passwordInputRef}
          type="text"
          placeholder="Paste Obfuscated Password..."
          onPaste={(e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData("text");
            const decoded = decodePassword(pastedText);
            if (decoded) {
              setRoomData((prev) => ({ ...prev, password: decoded }));
              alert("Password successfully decoded and set!");
            } else {
              alert("Invalid password format!");
            }
          }}
        />
      </div>

      {/* 🔹 Message Display */}
      <div className="message-display">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === "Me" ? "me" : ""}`}>
            <p>
              <strong>{msg.sender}:</strong>{" "}
              <span>{DOMPurify.sanitize(msg.text)}</span>
            </p>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* 🔹 Message Input */}
      <div className="message-input">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(DOMPurify.sanitize(e.target.value))}
          placeholder="> Type a message..."
          onKeyDown={(e) =>
            e.key === "Enter" &&
            handleSend(
              DOMPurify.sanitize(message),
              roomData.id,
              encryptionKey,
              sendMessage,
              () => {},
              setMessages,
              setMessage,
              lastMessageTime,
              setLastMessageTime,
              MESSAGE_COOLDOWN
            )
          }
        />
        <button
          onClick={() =>
            handleSend(
              DOMPurify.sanitize(message),
              roomData.id,
              encryptionKey,
              sendMessage,
              () => {},
              setMessages,
              setMessage,
              lastMessageTime,
              setLastMessageTime,
              MESSAGE_COOLDOWN
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
