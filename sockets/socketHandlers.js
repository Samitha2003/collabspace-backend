import Message from "../models/Message.js";

export default function registerSocketHandlers(io, socket) {
    socket.on("joinWorkspace", (workspaceId) => {
        socket.join(workspaceId);
    });

    socket.on("joinUserRoom", (userId) => {
        if (typeof userId !== "string" || userId.trim() === "") {
            console.warn(`Invalid userId provided to joinUserRoom: ${userId}`);
            return;
        }
        console.log(`joinUserRoom: userId=${userId}, socketId=${socket.id}`);
        socket.join(userId);
    });

    socket.on("leaveUserRoom", (userId) => {
        if (typeof userId !== "string" || userId.trim() === "") {
            return;
        }
        console.log(`leaveUserRoom: userId=${userId}, socketId=${socket.id}`);
        socket.leave(userId);
    });

    socket.on("leaveWorkspace", (workspaceId) => {
        socket.leave(workspaceId);
    });

    socket.on("cardMoved", ({ workspaceId, cardData }) => {
        socket.to(workspaceId).emit("cardMoved", cardData);
    });

    socket.on("newMessage", async ({ text, workspaceId, senderId }) => {
        try {
            const message = await Message.create({
                text,
                workspace: workspaceId,
                sender: senderId
            });
            const savedMessage = await message.populate("sender", "name email");
            
            io.to(workspaceId).emit("newMessage", savedMessage);
        } catch (error) {
            console.error("Error saving message:", error);
        }
    });

    socket.on("typing", ({ workspaceId, userName }) => {
        socket.to(workspaceId).emit("userTyping", userName);
    });

    socket.on("stopTyping", (workspaceId) => {
        socket.to(workspaceId).emit("stopTyping");
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
}

