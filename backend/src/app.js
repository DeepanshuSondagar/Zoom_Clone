import express from "express";
import { createServer } from "node:http";


import { Server } from "socket.io";
import mongoose from "mongoose";

import cors from "cors";
import userRoutes from "./routes/users.routers.js"

import { connectToSocket } from "./controllers/socketManegar.js"

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8080));
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb", extended: true}));

app.use("/api/v1/users", userRoutes);
 
const start = async () => {
   const connectionDb = await mongoose.connect(
    "mongodb+srv://Online_meeting:s6VkEUKLLYTuzQqe@cluster0.bjcvrmg.mongodb.net/",
  );
    console.log(`mongodb connected db host ${connectionDb.connection.host}`)
  server.listen(app.get("port"), () => {
    console.log("connection successful");
  });
};

start();
