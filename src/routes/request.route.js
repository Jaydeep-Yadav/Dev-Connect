import express from 'express';
import userAuth from '../middlewares/auth.js'
import ConnectionRequest from '../models/connectionRequest.model.js';
import User from '../models/user.model.js';
import sendEmail from "../utils/mailer.js";
import mongoose from 'mongoose';

const requestRouter = express.Router();

requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
    try {
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;

        const allowedStatus = ["ignored", "interested"];

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

        const message = status === "ignored" ? `You ignored ${req.user.firstName}` : `Connection request sent to ${toUser.firstName}`;


        // No data change for "ignore" api request
        if (status === "ignored") {
            return res.status(200).json({
                message: message
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

                //! Send interested email //
                await sendEmail(receiver.emailId, "INTEREST", sender.firstName);
            } catch (error) {
                console.error("Error sending email:", error);
            }
        }

        res.status(201).json({
            message: message,
            data
        })

    } catch (err) {
        res.status(400).send(err.message);
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


        if (status == "rejected") {
            await connectionRequest.deleteOne();

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
        res.status(400).send(err.message);
    }
})

export default requestRouter;