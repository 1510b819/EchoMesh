import { joinRoom } from "trystero/torrent";

const config = {
  appId: "echomesh",
  rtcConfig: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun.stunprotocol.org" },
      { urls: "stun:stunserver.org" },
      { urls: "stun:stun.voiparound.com" },
      { urls: "stun:stun.voipbuster.com" },
      { urls: "stun:stun.voipstunt.com" },
      { urls: "turn:turn01.hubl.in?transport=udp" },
      { urls: "turn:turn02.hubl.in?transport=tcp" },
      { urls: "turn:numb.viagenie.ca", username: "webrtc@live.com", credential: "muazkh" },
      { urls: "turn:192.158.29.39:3478?transport=udp", username: "28224511:1379330808", credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=" },
      { urls: "turn:192.158.29.39:3478?transport=tcp", username: "28224511:1379330808", credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=" },
      { urls: "turn:turn.bistri.com:80", username: "homeo", credential: "homeo" },
      { urls: "turn:turn.anyfirewall.com:443?transport=tcp", username: "webrtc", credential: "webrtc" }
    ] as RTCIceServer[]
  }
};

export const createRoom = (roomId: string) => {
  const room = joinRoom(config, roomId);
  const [sendMessage, getMessage] = room.makeAction<string>("message");
  return { sendMessage, getMessage };
};

export const generateRoomId = (): string => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(6)); // 6 bytes = 12 base36 chars
  const randomId = Array.from(randomBytes)
    .map((byte) => byte.toString(36).padStart(2, "0")) // Base36 encoding
    .join("")
    .slice(0, 12); // Ensure exactly 12 chars

  return `room-${randomId}`;
};
