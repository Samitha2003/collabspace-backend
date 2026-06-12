import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";

// Load environment variables from .env file
dotenv.config();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Used to parse JSON bodies
app.use(express.json());

// Frontend to work with backend
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));

// Store cookies in req.cookies
app.use(cookieParser());

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

connectDB();

server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

// Auth Routes 
app.use('/api/auth', authRoutes);