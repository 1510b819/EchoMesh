// Alert.tsx
import React from "react";
import "./Alert.css"; // Make sure to add some basic styles for the alert component

type AlertProps = {
  message: string;
  onClose: () => void;
};

const Alert: React.FC<AlertProps> = ({ message, onClose }) => {
  return (
    <div className="alert">
      <span>{message}</span>
      <button className="alert-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export default Alert;
