import { io, type Socket } from 'socket.io-client';

function getSocketBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) return 'http://localhost:3000';
  return envUrl.split(',').map((u) => u.trim()).filter(Boolean)[0] ?? 'http://localhost:3000';
}

let socket: Socket | null = null;

export function getNotificationsSocket(): Socket {
  if (!socket) {
    socket = io(`${getSocketBaseUrl()}/notifications`, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectNotificationsSocket(): void {
  getNotificationsSocket().connect();
}

export function disconnectNotificationsSocket(): void {
  socket?.disconnect();
}
