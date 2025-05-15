import express from 'express'
import connectDB from './config/database.js'
import cookieParser from 'cookie-parser';
import cors from 'cors'

import 'dotenv/config';

// For socket io
import http from 'http';

//? Cron Job to send daily reminder mails
// TODO : create a boolean field daily email reminders on user to send reminders
import './utils/cronjob.js';

const app = express();

app.use(cors({
    origin: process.env.HOST,
    credentials: true
}))

app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser()); // allows us to parse incoming cookies


import authRouter from './routes/auth.route.js'
import profileRouter from './routes/profile.route.js'
import requestRouter from './routes/request.route.js'
import userRouter from './routes/user.route.js'
import initializeSocket from './utils/socket.js'
import chatRouter from './routes/chat.route.js'

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);

/* Socket.IO is a library that enables low-latency, bidirectional and 
event-based communication between a client and a server. */

const httpServer = http.createServer(app);
initializeSocket(httpServer);

connectDB().then(() => {

    console.log("Database connected successfully");
    
    httpServer.listen(process.env.PORT, () => {
        console.log('Server listening on port '+ process.env.PORT);
    });

}).catch((err) => {
    console.log("Database cant be connected");
    console.log(err);
})





