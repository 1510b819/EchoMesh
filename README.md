# EchoMesh - Secure Encrypted Chat

EchoMesh is a serverless, decentralized, and secure encrypted real-time chat application. It allows users to create and join rooms, with all messages encrypted to ensure privacy and security. The app uses Libsodium for end-to-end encryption, allowing for safe communication within rooms. Built on a peer-to-peer architecture using Trystero, EchoMesh operates without the need for centralized servers, ensuring that all interactions are fully decentralized and private.

## Features

- Encrypted Messaging: All messages are encrypted with Libsodium's XChaCha20-Poly1305 encryption algorithm, ensuring privacy at all stages of communication.
- Secure Room Join: Users can create secure rooms and join existing ones with a password, all without relying on a centralized server.
- Real-time Communication: Messages are instantly shared between participants in a room, leveraging a peer-to-peer architecture.
- Command Support: Custom commands like /joinroom, /status, /help, and more allow users to interact dynamically within the chat.
- Message Lifetime Management: Messages automatically expire after 1 hour for automatic cleanup, further ensuring privacy.
- Clipboard Support: Room ID and password can be copied to the clipboard for easy sharing between users.
- Password Protection: Rooms are secured with password protection, ensuring only authorized users can join the conversation.
- Decentralized Design: EchoMesh operates serverless, with decentralized peer-to-peer communication using Trystero, ensuring no single point of failure.

## Tech Stack

- React: For building the user interface and frontend components.
- Libsodium: A cryptographic library used for encrypting and decrypting messages securely.
- Trystero: A decentralized peer-to-peer framework for managing room communication and message actions.
- DOMPurify: For sanitizing messages and preventing cross-site scripting (XSS) attacks, ensuring security and safety.

## Installation

To run this project locally, follow these steps:

Clone the repository:

    git clone https://github.com/your-username/echomesh.git
    cd echomesh

Install dependencies:

    npm install

Start the development server:

    npm start

    Then, open http://localhost:3000 in your browser.

## How to Use

    Create a New Room: Click the "New" button to create a new room. The room ID and password will be generated automatically. Copy these values and share them with others to invite them to the room.
    Join a Room: Enter a room ID and password to join an existing room. If the room is password-protected, you will need to enter the correct password.
    Send a Message: Type your message in the input field and press Enter or click "Send" to send the message. Your message will be encrypted before transmission.
    Use Commands: Type a command like /help or /joinroom <room-id> to interact with the chat application.
    Room ID & Password: The current room ID and password can be easily copied to the clipboard by clicking on them.

## Commands

    /room: Shows the current room name.
    /joinroom <room-id>: Joins the specified room.
    /status: Displays the current status of the user (e.g., connected or in a room).
    /clear: Clears the current chat history.
    /help: Displays a list of available commands and their usage.
    /me <message>: Performs an action or adds a status (e.g., /me dances).
    /whisper <user> <message>: Sends a private message to a specific user.
    /echo <message>: Echoes back the entered message (for testing).

## Code Structure

    src/: Main source folder containing React components, hooks, and utility functions.
        src/utils/cryptoUtils.ts: Functions for encryption, decryption, and key derivation using Libsodium.
        src/utils/trysteroUtils.ts: Functions for room creation and management using Trystero.
        src/utils/roomUtils.ts: Utilities for managing room operations like joining and leaving rooms.
        src/utils/messageUtils.ts: Functions for handling sending and receiving encrypted messages.
        src/components/: Contains React components such as Alert, PasswordModal, and others that handle the UI/UX.

## Libraries

    Libsodium: A high-performance cryptographic library used for encrypting messages and deriving keys.
    Trystero: A decentralized, peer-to-peer communication framework used for real-time communication in rooms.
    React: A popular JavaScript library for building user interfaces.
    DOMPurify: A sanitization library that ensures messages are free from malicious code, protecting against XSS attacks.

## Contributing

If you would like to contribute to this project, please follow these steps:

Fork the repository to your own GitHub account.

Create a new branch for your changes:

    git checkout -b feature-branch

Make your changes and commit them:

    git commit -am 'Add new feature or fix bug'

Push your changes to your forked repository:

    git push origin feature-branch

Open a pull request to the main repository.

## License

This project is licensed under the MIT License. See the LICENSE.md file for details.
