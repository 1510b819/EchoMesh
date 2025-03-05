import { useState, useEffect, useRef, useCallback } from "react";
import { deriveKeyFromPassword, decryptMessage } from "../utils/cryptoUtils";
import { createRoom, generateRoomId } from "../utils/trysteroUtils";
import { handleJoinRoom } from "../utils/roomUtils";
import { handleSend } from "../utils/messageUtils";
import DOMPurify from "dompurify";

// Import the CSS file
import "./Chat.css";

type Message = {
  text: string;
  sender: string;
  timestamp: number;
};

const MESSAGE_LIFETIME = 60 * 60 * 1000; // 1 hour
const MESSAGE_COOLDOWN = 1000; // 1-second cooldown

const Chat = () => {
  // 🔹 Load stored session data or generate a new room
  const [roomData, setRoomData] = useState(() => {
    const storedRoom = sessionStorage.getItem("echomesh-room"); // Keep roomId stored
    return storedRoom ? { id: storedRoom, password: "" } : generateRoomId(); // Don't load password from storage
  });
  

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [customRoom, setCustomRoom] = useState("");
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { sendMessage, getMessage } = createRoom(roomData.id);

  // ✅ Function to update only the room ID
  const setRoomId = (newRoomId: string) => {
    setRoomData((prev) => ({ ...prev, id: newRoomId }));
  };

  // 🔐 Derive encryption key when password changes
  useEffect(() => {
    const deriveKey = async () => {
      if (!roomData.password) {
        console.warn("No password provided, encryption is disabled.");
        setEncryptionKey(null);
        return;
      }

      try {
        const key = await deriveKeyFromPassword(roomData.password, roomData.id);
        setEncryptionKey(key);
      } catch (error) {
        console.error("Key derivation failed:", error);
      }
    };

    deriveKey();
  }, [roomData.password, roomData.id]);

  // 🧹 Cleanup old messages every minute
  useEffect(() => {
    const cleanupMessages = () => {
      setMessages((prev) =>
        prev.filter((msg) => Date.now() - msg.timestamp < MESSAGE_LIFETIME)
      );
    };

    const cleanupInterval = setInterval(cleanupMessages, 60000);
    return () => clearInterval(cleanupInterval);
  }, []);

  // 📩 Handle incoming encrypted messages
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

  // 🔽 Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ⌨️ Auto-focus input field on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 🏠 Handle room joining
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
              navigator.clipboard.writeText(roomData.password);
              alert("Password copied to clipboard!");
            }}
            style={{ cursor: "pointer", textDecoration: "underline" }}
          >
            Password: {roomData.password}
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
          sessionStorage.setItem("echomesh-room", newRoom.id); // ✅ Only storing roomId
          alert(
            `New room created!\nRoom ID: ${newRoom.id}\nPassword: ${newRoom.password}\n\n⚠️ Please save this password! You will lose access if you refresh.`
          );
        }}
      >
        New
      </button>
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
              setRoomId,
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
              setRoomId,
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
