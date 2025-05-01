import { config } from "./config.js";

let socket = null;
const listeners = {};

function initializeSocket() {
  if (typeof io === "undefined") {
    console.error("Socket.IO client library (io) not found.");
    return null;
  }
  if (socket) {
    return socket;
  }

  socket = io();

  socket.on(config.socket.events.CONNECT, () => {
    console.log("Socket connected.");
    emitLocalEvent(config.socket.events.CONNECT);
  });

  socket.on(config.socket.events.DISCONNECT, () => {
    console.log("Socket disconnected.");
    emitLocalEvent(config.socket.events.DISCONNECT);
  });

  socket.on(config.socket.events.CONNECT_ERROR, (err) => {
    console.error("Socket connection error:", err);
    emitLocalEvent(config.socket.events.CONNECT_ERROR, err);
  });

  return socket;
}

function on(eventName, callback) {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return;
  }
  if (!listeners[eventName]) {
    listeners[eventName] = [];
    socket.on(eventName, (data) => {
      emitLocalEvent(eventName, data);
    });
  }
  listeners[eventName].push(callback);
}

function emit(eventName, data) {
  if (!socket || !socket.connected) {
    console.warn(`Socket not connected. Cannot emit event '${eventName}'.`);
    return;
  }
  socket.emit(eventName, data);
}

function emitLocalEvent(eventName, data) {
  if (listeners[eventName]) {
    listeners[eventName].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for event ${eventName}:`, error);
      }
    });
  }
}

function isConnected() {
  return socket?.connected ?? false;
}

export const socketManager = {
  initialize: initializeSocket,
  on,
  emit,
  isConnected,
};
