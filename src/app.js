import express from 'express'
import connectDB from './config/database.js'
import cookieParser from 'cookie-parser';
import cors from 'cors'

import 'dotenv/config';

const app = express();

app.use(cors({
    origin: process.env.HOST,
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())


import authRouter from './routes/auth.route.js'
import profileRouter from './routes/profile.route.js'
import requestRouter from './routes/request.route.js'
import userRouter from './routes/user.route.js'

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);


connectDB().then(() => {
    console.log("Database connected successfully");
    app.listen(process.env.PORT, () => {
        console.log('Server listening on port 3000');
    });

}).catch((err) => {
    console.log("Database cant be connected");
    console.log(err);
})





