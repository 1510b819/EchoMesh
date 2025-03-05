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
    }
  };

  if (!isOpen) return null; // Modal is only shown when isOpen is true

  return (
    <div className="password-modal">
      <div className="modal-content">
        <h2>Enter Password for Room: {roomId}</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter room password"
        />
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default PasswordModal;
