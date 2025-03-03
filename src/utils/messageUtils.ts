import { encryptMessage } from "./cryptoUtils";
import { handleCommand } from "./commands";

type SendMessageFunction = (msg: string) => void;
type SetMessagesFunction = React.Dispatch<React.SetStateAction<{ text: string; sender: string; timestamp: number }[]>>;
type SetMessageFunction = React.Dispatch<React.SetStateAction<string>>;
type SetLastMessageTimeFunction = React.Dispatch<React.SetStateAction<number>>;

export const handleSend = async (
  message: string,
  roomId: string,
  encryptionKey: CryptoKey | null,
  sendMessage: SendMessageFunction,
  setMessages: SetMessagesFunction,
  setMessage: SetMessageFunction,
  lastMessageTime: number,
  setLastMessageTime: SetLastMessageTimeFunction,
  messageCooldown: number
) => {
  const now = Date.now();

  if (now - lastMessageTime < messageCooldown) {
    console.warn("You're sending messages too fast! Slow down.");
    return;
  }

  if (!message.trim()) return;

  setLastMessageTime(now);

  if (message.startsWith("/")) {
    handleCommand({ message, roomId, setRoomId: () => {}, setMessages, setMessage });
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
    setMessages((prev) => [...prev, { text: message, sender: "Me", timestamp: now }]);
    setMessage("");
  } catch (error) {
    console.error("Message encryption failed:", error);
  }
};
