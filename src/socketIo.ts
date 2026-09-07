import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import httpStatus from "http-status";
import AppError from "./app/error/AppError";
import { verifyToken } from "./app/utils/tokenManage";
import config from "./app/config";
import { IJwtPayload } from "./app/modules/auth/auth.interface";

import { INotification } from "./app/modules/notifications/notifications.interface";
import Notification from "./app/modules/notifications/notifications.model";
import firebaseAdmin from "./app/utils/firebase";
import { User } from "./app/modules/user/user.models";

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// =====================
// Connected users store
// =====================
interface ConnectedUser {
  socketIDs: Set<string>; // multiple devices support
  role?: string;
}
declare module 'socket.io' {
  interface Socket {
    user: {
      userId: string;
      role: string;
      fullName: string;
      email: string;
      phone?: string;
      isPhoneVerify?: boolean;
      iat?: number;
      exp?: number;
    };
  }
}

export const connectedUsers = new Map<string, ConnectedUser>();
const socketUserMap = new Map<string, string>();
const openChats = new Map<string, boolean>();

let io: Server;
export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};

export default function initSocket(ioInstance: Server) {
  io = ioInstance;
  console.log("Socket.IO initialized======");
  // =====================
  // Auth middleware
  // =====================
  io.use(async (socket: Socket, next) => {
    try {
      const token = (socket.handshake.auth.token as string) ||
        (socket.handshake.headers.token as string) ||
        (socket.handshake.headers.authorization as string);

      if (!token) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Token missing");
      }

      const payload = verifyToken({
        token,
        access_secret: config.jwt_access_secret as string,
      });

      socket.user = payload as IJwtPayload;
      next();
    } catch (err) {
      console.error("Socket auth error:", err);
      socket.disconnect(true);
    }
  });

  // =====================
  // Connection
  // =====================
  io.on("connection", (socket: Socket) => {
    const userId = socket.user.userId;

    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, { socketIDs: new Set() });
    }


    connectedUsers.get(userId)!.socketIDs.add(socket.id);
    socketUserMap.set(socket.id, userId);

    if (connectedUsers.get(userId)?.socketIDs.size === 1) {
      socket.broadcast.emit("userOnline", { userId });
    }
    // =====================
    // Join chat (private / group)
    // =====================



    // =====================
    // Disconnect
    // =====================
    socket.on("disconnect", () => {
      const uid = socketUserMap.get(socket.id);
      if (!uid) return;

      socketUserMap.delete(socket.id);
      const user = connectedUsers.get(uid);

      if (user) {
        user.socketIDs.delete(socket.id);
        if (user.socketIDs.size === 0) {
          connectedUsers.delete(uid);
          socket.broadcast.emit("userOffline", { userId: uid });
        }
      }

      for (const key of openChats.keys()) {
        if (key.startsWith(`${socket.id}:`)) {
          openChats.delete(key);
        }
      }
    });
  });
}


// =====================
// Emit notification
// =====================
export const emitNotification = async ({
  senderId,
  receiverId,
  message,
  type
}: Partial<INotification>) => {
  if (!io) throw new Error('Socket.IO not initialized');

  // Get all connected sockets for receiver
  const userSockets = connectedUsers.get(receiverId!.toString())?.socketIDs;

  // Get unread count from DB
  // const unreadCount = await Notification.countDocuments({ receiverId, isRead: false });



  // Save to DB asynchronously
  const notificationComplete = await Notification.create({
    senderId,
    receiverId,
    message,
    type,
    isRead: false,
  }).catch((err) => console.error('Notification save error:', err));

  const receiver = await User.findById(receiverId);
  console.log("test for fcm",receiver,userSockets)
  // Emit to all connected sockets
  if (userSockets && message) {
    userSockets.forEach((socketID) => {
      io.to(socketID).emit('notification', {
        success: true,
        statusCode: 200,
        data: notificationComplete
      });
    });
  } 
   if( receiver?.fcmToken) {
    // User is offline: use FCM
    console.log('📱 Push notification sent via FCM');
    try {
      await firebaseAdmin.messaging().send({
        token: receiver.fcmToken,
        notification: {
          title: message?.title,
          body: message?.body || 'You have a new update!',
        },
        data: {
          userId: senderId!.toString(),
          type: type || 'default',
        },
      });
      // console.log('📱 Push notification sent via FCM');
    } catch (err) {
      console.error('❌ Error sending FCM push:', err);
    }
  }
  return notificationComplete
};











export const deleteMessageConfirmation = async ({ targetId, senderId, chatId, messageId }: any) => {
  const isOpen = isChatOpenForUser(targetId, chatId);

  if (isOpen) {
    const payload = {
      chatId,
      messageId
    }
    //  Emit to Target
    // -------------------------------
    const targetSockets = connectedUsers.get(targetId)?.socketIDs || [];
    targetSockets.forEach((sid) => io.to(sid).emit("deleteMessage", payload));

    // -------------------------------
    // Emit to Sender's Other Devices
    // -------------------------------
    const senderSockets = connectedUsers.get(senderId)?.socketIDs || [];
    senderSockets.forEach((sid) => {
      io.to(sid).emit("deleteMessage", payload);
    });
  }

}



const isChatOpenForUser = (userId: string, chatId: string) => {
  const userSockets = connectedUsers.get(userId)?.socketIDs;
  if (!userSockets) return false;

  for (const sid of userSockets) {
    if (openChats.get(`${sid}:${chatId}`)) {
      return true;
    }
  }
  return false;
};


export const emergencyServicerNotification = async (nearbyUsers: any[], sosService: any, getServiceDetails: any) => {

  // Iterate only over online users
  for (const user of nearbyUsers) {
    const connected = connectedUsers.get(user._id.toString());
    if (!connected) continue; // skip offline

    for (const socketId of connected.socketIDs) {
      io.to(socketId).emit('emergencyServiceNotification', {
        message: 'New emergency service nearby!',
        data: getServiceDetails,
      });
    }
  }
}

export const multiBookingNotification = async (
  nearbyUsers: any[],
  serviceDetails: any
) => {
  for (const user of nearbyUsers) {
    const connected = connectedUsers.get(user._id.toString());

    if (connected) {
      // User online: socket emit
      for (const socketId of connected.socketIDs) {
        io.to(socketId).emit('multiBookingNotification', {
          message: 'New multi guard booking available nearby',
          data: serviceDetails,
        });
      }
    } else {
      // User offline: FCM push
      const receiver = await User.findById(user._id).select('fcmToken');

      if (!receiver?.fcmToken) continue;

      // try {
      //   await firebaseAdmin.messaging().send({
      //     token: receiver.fcmToken,
      //     notification: {
      //       title: 'New Booking Nearby',
      //       body: 'New multi guard booking available nearby',
      //     },
      //     data: {
      //       type: 'multiBookingNotification',
      //       serviceDetails: JSON.stringify(serviceDetails),
      //     },
      //   });
      // } catch (err) {
      //   console.error(`❌ FCM push failed for user ${user._id}:`, err);
      // }
    }
  }
};
export const serviceJoinNotification = async ({ clientId, payload }: any) => {
  const connected = connectedUsers.get(clientId.toString());

  if (connected) {
    // User online: socket emit
    for (const socketId of connected.socketIDs) {
      io.to(socketId).emit('serviceJoinNotification', {
        message: 'Join a new guard',
        data: payload,
      });
    }
  } else {
    // User offline: FCM push
    const receiver = await User.findById(clientId).select('fcmToken');

    if (!receiver?.fcmToken) return;

    // try {
    //   await firebaseAdmin.messaging().send({
    //     token: receiver.fcmToken,
    //     notification: {
    //       title: 'Join a new guard',
    //       body: 'A new guard has joined your service',
    //     },
    //     data: {
    //       type: 'serviceJoinNotification',
    //       payload: JSON.stringify(payload),
    //     },
    //   });
    // } catch (err) {
    //   console.error(`❌ FCM push failed for client ${clientId}:`, err);
    // }
  }
};
