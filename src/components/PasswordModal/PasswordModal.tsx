import React, { useState } from "react";

type PasswordModalProps = {
  isOpen: boolean;
  roomId: string;
  onClose: () => void;
  onSubmit: (password: string) => void;
};

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, roomId, onClose, onSubmit }) => {
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    if (password.trim()) {
      onSubmit(password); // Pass the entered password back to parent component (handlePasswordSubmit)
      localStorage.setItem("echomesh-room-password", password); // Save password to localStorage
    }
  };

  if (!isOpen) return null; // Modal is only shown when isOpen is true

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Enter Password for Room: {roomId}</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter room password"
        />
        <div className="modal-buttons">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
