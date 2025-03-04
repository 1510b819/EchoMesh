import { encryptMessage } from "./cryptoUtils";
import { handleCommand } from "./commands";

type SendMessageFunction = (msg: string) => void;
type SetMessagesFunction = React.Dispatch<
  React.SetStateAction<{ text: string; sender: string; timestamp: number }[]>
>;
type SetMessageFunction = React.Dispatch<React.SetStateAction<string>>;
type SetLastMessageTimeFunction = React.Dispatch<React.SetStateAction<number>>;

// Handle the send prompts
export const handleSend = async (
  message: string,
  roomId: string,
  encryptionKey: Uint8Array | null, // 🔑 Update type to Uint8Array
  sendMessage: SendMessageFunction,
  setRoomId: (roomId: string) => void,
  setMessages: SetMessagesFunction,
  setMessage: SetMessageFunction,
  lastMessageTime: number,
  setLastMessageTime: SetLastMessageTimeFunction,
  messageCooldown: number
) => {
  const now = Date.now();

  if (!message.trim() || !encryptionKey) return; // Check for message and encryptionKey validity

  if (now - lastMessageTime < messageCooldown) {
    console.warn("You're sending messages too fast! Slow down.");
    return;
  }

  setLastMessageTime(now);

  // Handle command messages like /joinroom, /status, etc.
  if (message.startsWith("/")) {
    handleCommand({ message, roomId, setRoomId, setMessages, setMessage });
    setMessage("");
    return;
  }

  try {
    // Encrypt the message with libsodium
    const encryptedMsg = await encryptMessage(message, encryptionKey);
    sendMessage(encryptedMsg); // Send the encrypted message
    setMessages((prev) => [
      ...prev,
      { text: message, sender: "Me", timestamp: Date.now() }
    ]);
    setMessage(""); // Clear the input field
  } catch (error) {
    console.error("Message encryption failed:", error);
    setMessages((prev) => [
      ...prev,
      { text: "[Encryption Error]", sender: "System", timestamp: Date.now() }
    ]);
  }
};
