import Notification from "../models/Notification.js";
import { getIO } from "./socketInstance.js";

async function createNotification({ recipient, type, message, relatedCard, relatedWorkspace }) {
    try {
        const newNotification = await Notification.create({
            recipient,
            type,
            message,
            relatedCard,
            relatedWorkspace
        });

        // emit event to the user's room
        getIO().to(recipient.toString()).emit("newNotification", newNotification);

        return newNotification;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

export default createNotification;