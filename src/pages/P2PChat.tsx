import React, { useState, useEffect } from "react";
import { joinRoom } from "trystero/torrent"; // Using BitTorrent strategy

const config = { appId: "echomesh" }; // Unique app identifier
const roomId = "chat-room"; // Namespace for users

// Define the message type
interface Message {
  text: string;
  sender: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]); // Explicitly set type
  const [message, setMessage] = useState<string>("");
  const room = joinRoom(config, roomId);
  const [sendMessage, getMessage] = room.makeAction<string>("message"); // Ensure payload is string

  // Receive messages
  useEffect(() => {
    getMessage((msg, peerId) => {
      setMessages((prev) => [...prev, { text: msg, sender: peerId }]);
    });
  }, []);

  // Handle sending messages
  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessages((prev) => [...prev, { text: message, sender: "Me" }]);
      setMessage("");
    }
  };

  return (
    <div>
      <h2>Chat Room</h2>
      <div style={{ border: "1px solid #ccc", padding: "10px", height: "200px", overflowY: "scroll" }}>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sender}:</strong> {msg.text}
          </p>
        ))}
      </div>
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
