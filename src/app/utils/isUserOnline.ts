import { connectedUsers } from "../../socketIo";

export const isUserOnline = (userId: string): boolean => {
  return connectedUsers.has(userId.toString());
};