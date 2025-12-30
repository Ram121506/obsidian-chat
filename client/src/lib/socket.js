import { io } from "socket.io-client";

// Use Environment Variable for Production, otherwise fallback to local hostname
const socketUrl = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3001`;

const socket = io(socketUrl, {
    autoConnect: false,
    reconnection: true,
});

export default socket;
