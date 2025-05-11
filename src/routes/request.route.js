import express from 'express';
const requestRouter = express.Router();

import userAuth from '../middlewares/auth.js'
import ConnectionRequest from '../models/connectionRequest.model.js';
import User from '../models/user.model.js';
import sendEmail from "../utils/mailer.js";
import mongoose from 'mongoose';

requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
    try {
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;

        const allowedStatus = ["ignored", "interested"];
        // const allowedStatus = ["interested"];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status type: " + status });
        }

        const toUser = await User.findById(toUserId);

        if (!toUser) {
            return res.status(404).json({ message: "User not found !" });
        }

        const existingConnectionRequest = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId }
            ]
        })

        if (existingConnectionRequest) {
            return res.status(400).send({ message: "Connection Request Already Exists !" });
        }

        const statusMessage = status === "ignored" ? " ignored " : " is interested in ";
        
        if(status === "ignored") {
            return res.status(200).json({
                message: req.user.firstName + statusMessage + toUser.firstName
            })
        }


        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status,
        });

        const data = await connectionRequest.save();


        // Send Email
        if (status == "interested") {
            try {
                const sender = await User.findById(new mongoose.Types.ObjectId(fromUserId)).select("firstName");
                const receiver = await User.findById(new mongoose.Types.ObjectId(toUserId)).select("emailId");

                await sendEmail(receiver.emailId, "INTEREST", sender.firstName );
            } catch (error) {
                console.error("Error sending email:", error);
            }
        }

        res.status(201).json({
            message: req.user.firstName + statusMessage + toUser.firstName,
            data
        })

    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
})

requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;
        const { status, requestId } = req.params;

        const allowedStatus = ["accepted", "rejected"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Status not allowed" });
        }

        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUser._id,
            status: "interested"
        });

        if (!connectionRequest) {
            return res.status(404).json({ message: "Connection request not found" });
        }


        if(status == "rejected"){
            let data = await connectionRequest.deleteOne();
            return res.status(200).json({
                message: "Connection Request " + status,
            });
        }

        connectionRequest.status = status;

        const data = await connectionRequest.save();

        res.status(200).json({
            message: "Connection Request " + status,
            data
        });

    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
})

export default requestRouter;