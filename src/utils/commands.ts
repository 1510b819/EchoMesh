export type CommandHandlerProps = {
  message: string;
  roomId: string;
  setRoomId: (roomId: string) => void;
  setMessages: (messages: (prev: { text: string; sender: string; timestamp: number }[]) => { text: string; sender: string; timestamp: number }[]) => void;
  setMessage: (message: string) => void;
  username?: string; // Optional username prop
};

export const handleCommand = ({ message, roomId, setRoomId, setMessages, setMessage, username = "Me" }: CommandHandlerProps) => {
  const parts = message.trim().split(" ");
  const command = parts[0];

  switch (command) {
      case "/room":
          setMessages((prev) => [
              ...prev,
              { text: `Current room: ${roomId}`, sender: "System", timestamp: Date.now() }
          ]);
          break;

      case "/joinroom":
          if (parts.length < 2) {
              setMessages((prev) => [
                  ...prev,
                  { text: "Usage: /joinroom <room_name>", sender: "System", timestamp: Date.now() }
              ]);
          } else {
              const newRoom = parts.slice(1).join(" ");
              setRoomId(newRoom);
              setMessages(() => [
                  { text: `Joined room: ${newRoom}`, sender: "System", timestamp: Date.now() } // ✅ FIXED: Now using a function
              ]);
          }
          break;

      case "/clear":
          setMessages(() => []); // ✅ FIXED: Now using a function to clear messages
          break;

      case "/help":
          setMessages((prev) => [
              ...prev,
              { text: "Available commands:", sender: "System", timestamp: Date.now() },
              { text: "/room - Shows the current room name", sender: "System", timestamp: Date.now() },
              { text: "/joinroom <room> - Join a different room", sender: "System", timestamp: Date.now() },
              { text: "/status - Show your current status", sender: "System", timestamp: Date.now() },
              { text: "/clear - Clears the chat", sender: "System", timestamp: Date.now() },
              { text: "/me <message> - Perform an action", sender: "System", timestamp: Date.now() },
              { text: "/whisper <user> <message> - Send a private message", sender: "System", timestamp: Date.now() },
              { text: "/echo <message> - Repeat back your message", sender: "System", timestamp: Date.now() },
          ]);
          break;

      case "/me":
          if (parts.length < 2) {
              setMessages((prev) => [
                  ...prev,
                  { text: "Usage: /me <message>", sender: "System", timestamp: Date.now() }
              ]);
          } else {
              const actionMessage = parts.slice(1).join(" ");
              setMessages((prev) => [
                  ...prev,
                  { text: `*${username} ${actionMessage}*`, sender: "System", timestamp: Date.now() }
              ]);
          }
          break;

      case "/whisper":
          if (parts.length < 3) {
              setMessages((prev) => [
                  ...prev,
                  { text: "Usage: /whisper <user> <message>", sender: "System", timestamp: Date.now() }
              ]);
          } else {
              const user = parts[1];
              const privateMessage = parts.slice(2).join(" ");
              setMessages((prev) => [
                  ...prev,
                  { text: `(whisper to ${user}): ${privateMessage}`, sender: username, timestamp: Date.now() }
              ]);
          }
          break;

      case "/echo":
          if (parts.length < 2) {
              setMessages((prev) => [
                  ...prev,
                  { text: "Usage: /echo <message>", sender: "System", timestamp: Date.now() }
              ]);
          } else {
              const echoMessage = parts.slice(1).join(" ");
              setMessages((prev) => [
                  ...prev,
                  { text: echoMessage, sender: "EchoBot", timestamp: Date.now() }
              ]);
          }
          break;

      default:
          setMessages((prev) => [
              ...prev,
              { text: `Unknown command: ${command}. Type /help for a list of commands.`, sender: "System", timestamp: Date.now() }
          ]);
          break;
  }

  setMessage(""); // Clear input field after executing command
};
