import { Server as socket } from 'socket.io'
import crypto from 'crypto'
import Chat from '../models/chat.model.js';
import { time } from 'console';

const initializeSocket = (server) => {
    const io = new socket(server, {
        cors: {
            origin: process.env.HOST,
            // credentials: true
        },
    });


    io.on("connection", (socket) => {

        const getSecretRoomId = (userId, targetUserId) => {
            return crypto
                .createHash("sha256")
                .update([userId, targetUserId].sort().join("$"))
                .digest("hex");
        };

        // Handle events

        socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
            const roomId = getSecretRoomId(userId, targetUserId);
            socket.join(roomId);
        })

        socket.on("sendMessage", async ({ firstName, lastName, userId, targetUserId, text, timestamp }) => {
            // Save messages to the database
            try {
                const roomId = getSecretRoomId(userId, targetUserId);

                // TODO: Check if userId & targetUserId are friends
                

                // Check if chat document exists
                let chat = await Chat.findOne({
                    participants: { $all: [userId, targetUserId] },
                });

                // create new Chat if chat not exists 
                if (!chat) {
                    chat = new Chat({
                        participants: [userId, targetUserId],
                        messages: [],
                    });
                }

                // Push messages to chat
                chat.messages.push({
                    senderId: userId,
                    text,
                    timestamp
                });

                await chat.save();
                
                io.to(roomId).emit("messageReceived", { firstName, lastName, text, timestamp });

            } catch (err) {
                console.log(err);
            }

        })

        socket.on("disconnect", () => { });

    })

}

export default initializeSocket;