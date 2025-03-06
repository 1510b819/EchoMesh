import { encryptMessage } from "./cryptoUtils";
import { handleCommand } from "./commands";

// 
type SendMessageFunction = (msg: string) => void;
type SetMessagesFunction = React.Dispatch<
  React.SetStateAction<{ text: string; sender: string; timestamp: number }[]>
>;
type SetMessageFunction = React.Dispatch<React.SetStateAction<string>>;
type SetLastMessageTimeFunction = React.Dispatch<React.SetStateAction<number>>;

export const handleSend = async (
  message: string,
  roomId: string,
  encryptionKey: Uint8Array | null,
  lastNonce: number, // Pass lastNonce
  setLastNonce: React.Dispatch<React.SetStateAction<number>>, // Add setter for lastNonce
  sendMessage: SendMessageFunction,
  setRoomId: (roomId: string) => void,
  setMessages: SetMessagesFunction,
  setMessage: SetMessageFunction,
  lastMessageTime: number,
  setLastMessageTime: SetLastMessageTimeFunction,
  messageCooldown: number
) => {
  const now = Date.now();

  if (!message.trim() || !encryptionKey) return;

  if (now - lastMessageTime < messageCooldown) {
    console.warn("You're sending messages too fast! Slow down.");
    return;
  }

  setLastMessageTime(now);

  if (message.startsWith("/")) {
    handleCommand({ message, roomId, setRoomId, setMessages, setMessage });
    setMessage("");
    return;
  }

  try {
    // Encrypt the message with the lastNonce
    const encryptedMsg = await encryptMessage(message, encryptionKey);

    sendMessage(encryptedMsg);

    // Update lastNonce (increment or get from encryption)
    setLastNonce(lastNonce + 1);

    setMessages((prev) => [
      ...prev,
      { text: message, sender: "Me", timestamp: Date.now() }
    ]);
    setMessage("");
  } catch (error) {
    console.error("Message encryption failed:", error);
    setMessages((prev) => [
      ...prev,
      { text: "[Encryption Error]", sender: "System", timestamp: Date.now() }
    ]);
  }
};
