import { useState, useEffect, useRef, useCallback } from "react";
import { combineKeysForEncryption, decryptMessage, deriveDiffieHellmanKeyPair } from "../utils/cryptoUtils";
import { createRoom, generateRoomId } from "../utils/trysteroUtils";
import { handleJoinRoom } from "../utils/roomUtils";
import { handleSend } from "../utils/messageUtils";
import DOMPurify from "dompurify";
import Alert from "../components/Alert/Alert"; // Import the Alert component
import PasswordModal from "../components/PasswordModal/PasswordModal"; // Import the PasswordModal component

import "./Chat.css";

type Message = {
  text: string;
  sender: string;
  timestamp: number;
};

const MESSAGE_LIFETIME = 60 * 60 * 1000; // 1 hour 
const MESSAGE_COOLDOWN = 1000; // 1-second cooldown
const MAX_MESSAGE_LENGTH = 500; // Maximum message length (can be adjusted)

const Chat = () => {
  const [roomData, setRoomData] = useState(() => generateRoomId()); // No longer from sessionStorage
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [customRoom, setCustomRoom] = useState("");
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // State for alert message
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const { sendMessage, getMessage } = createRoom(roomData.id);

  const setRoomId = (newRoomId: string) => {
    setRoomData((prev) => ({ ...prev, id: newRoomId }));
  };

  useEffect(() => {
    const deriveKey = async () => {
      if (!roomData.password) {
        console.warn("No password provided, encryption is disabled.");
        setEncryptionKey(null);
        return;
      }
  
      try {
        // Generate Diffie-Hellman key pair
        const { privateKey, publicKey } = await deriveDiffieHellmanKeyPair(roomData.id, roomData.password);
  
        // Combine the password-based key and Diffie-Hellman shared secret
        const combinedKey = await combineKeysForEncryption(roomData.password, roomData.id, privateKey, publicKey);
        setEncryptionKey(combinedKey);
      } catch (error) {
        console.error("Key derivation failed:", error);
      }
    };
  
    deriveKey();
  }, [roomData.password, roomData.id]);

  useEffect(() => {
    const cleanupMessages = () => {
      setMessages((prev) =>
        prev.filter((msg) => Date.now() - msg.timestamp < MESSAGE_LIFETIME)
      );
    };

    const cleanupInterval = setInterval(cleanupMessages, 60000);
    return () => clearInterval(cleanupInterval);
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

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const bottom = messagesContainerRef.current.scrollHeight === messagesContainerRef.current.scrollTop + messagesContainerRef.current.clientHeight;
    if (!bottom) {
      // If not scrolled to the bottom, don't load more messages
      return;
    }

    // Scroll is at the bottom, load more messages
    loadMoreMessages();
  };

  const loadMoreMessages = () => {
    // Here you would fetch older messages from your storage (or other source)
    // For now, we will simulate this by adding older messages to the state
    const olderMessages: Message[] = [
      { text: "Older message 1", sender: "Peer", timestamp: Date.now() - 1000000 },
      { text: "Older message 2", sender: "Peer", timestamp: Date.now() - 10000000 },
    ];

    setMessages((prev) => [...olderMessages, ...prev]);
  };

  const handleRoomJoin = useCallback(
    (room: string) => {
      setCurrentRoomId(room);
      setPasswordModalOpen(true); // Open password modal
    },
    []
  );

  const handlePasswordSubmit = (password: string) => {
    handleJoinRoom(currentRoomId, setRoomData, setMessages, setCustomRoom);  // Do not pass the password here anymore
    setRoomData((prev) => ({ ...prev, password }));  // Set password in state directly
    setPasswordModalOpen(false); // Close the modal after submitting
  };

  const handleCloseModal = () => {
    setPasswordModalOpen(false);
  };

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), 3000); // Hide alert after 3 seconds
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedInput = DOMPurify.sanitize(e.target.value);

    // Validate message length
    if (sanitizedInput.length <= MAX_MESSAGE_LENGTH) {
      setMessage(sanitizedInput);
    } else {
      showAlert(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`);
    }
  };

  return (
    <div className="chat-container">
      {/* Display the alert component */}
      {alertMessage && <Alert message={alertMessage} onClose={() => setAlertMessage(null)} />}

      {/* 🔹 Header */}
      <div className="chat-header">
        <h3>EchoMesh</h3>
        <small>
          <span
            onClick={() => {
              navigator.clipboard.writeText(roomData.id);
              showAlert("Room ID copied to clipboard!");
            }}
            style={{ cursor: "pointer", textDecoration: "underline" }}
          >
            Room: {roomData.id}
          </span>
          <br />
          <span
            onClick={() => {
              navigator.clipboard.writeText(roomData.password);
              showAlert("Password copied to clipboard!");
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
            showAlert(`New room created!\nRoom ID: ${newRoom.id}\nPassword: ${newRoom.password}\n`);
          }}
        >
          New
        </button>
      </div>

      {/* 🔹 Message Display */}
      <div
        className="message-display"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
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
          onChange={handleInputChange}
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

      {/* Password Modal */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        roomId={currentRoomId}
        onClose={handleCloseModal}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
};

export default Chat;
