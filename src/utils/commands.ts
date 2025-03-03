export type CommandHandlerProps = {
    message: string;
    roomId: string;
    setRoomId: (roomId: string) => void;
    setMessages: (messages: (prev: { text: string; sender: string }[]) => { text: string; sender: string }[]) => void;
    setMessage: (message: string) => void;
  };
  
  export const handleCommand = ({ message, roomId, setRoomId, setMessages, setMessage }: CommandHandlerProps) => {
    const parts = message.split(" ");
    const command = parts[0];
  
    switch (command) {
      case "/room":
        setMessages((prev) => [...prev, { text: `Current room: ${roomId}`, sender: "System" }]);
        break;
  
      case "/joinroom":
        if (parts.length < 2) {
          setMessages((prev) => [...prev, { text: "Usage: /joinroom <room_name>", sender: "System" }]);
        } else {
          const newRoom = parts.slice(1).join(" ");
          setRoomId(newRoom);
          setMessages(() => [{ text: `Joined room: ${newRoom}`, sender: "System" }]); // Clears chat
        }
        break;
  
      case "/status":
        setMessages((prev) => [...prev, { text: "Status: Online", sender: "System" }]);
        break;
  
      case "/clear":
        setMessages(() => [{ text: "Chat cleared.", sender: "System" }]);
        break;
  
      case "/help":
        setMessages((prev) => [
          ...prev,
          { text: "Available commands:", sender: "System" },
          { text: "/room - Shows the current room name", sender: "System" },
          { text: "/joinroom <room> - Join a different room", sender: "System" },
          { text: "/status - Show your current status", sender: "System" },
          { text: "/clear - Clears the chat", sender: "System" },
          { text: "/me <message> - Perform an action", sender: "System" },
          { text: "/whisper <user> <message> - Send a private message", sender: "System" },
          { text: "/echo <message> - Repeat back your message", sender: "System" }
        ]);
        break;
  
      case "/me":
        if (parts.length < 2) {
          setMessages((prev) => [...prev, { text: "Usage: /me <message>", sender: "System" }]);
        } else {
          const actionMessage = parts.slice(1).join(" ");
          setMessages((prev) => [...prev, { text: `*${actionMessage}*`, sender: "Me" }]);
        }
        break;
  
      case "/whisper":
        if (parts.length < 3) {
          setMessages((prev) => [...prev, { text: "Usage: /whisper <user> <message>", sender: "System" }]);
        } else {
          const user = parts[1];
          const privateMessage = parts.slice(2).join(" ");
          setMessages((prev) => [...prev, { text: `(whisper to ${user}): ${privateMessage}`, sender: "Me" }]);
        }
        break;
  
      case "/echo":
        if (parts.length < 2) {
          setMessages((prev) => [...prev, { text: "Usage: /echo <message>", sender: "System" }]);
        } else {
          const echoMessage = parts.slice(1).join(" ");
          setMessages((prev) => [...prev, { text: echoMessage, sender: "EchoBot" }]);
        }
        break;
  
      default:
        setMessages((prev) => [...prev, { text: `Unknown command: ${command}. Type /help for a list of commands.`, sender: "System" }]);
        break;
    }
  
    setMessage(""); // Clear input field after executing command
  };
  