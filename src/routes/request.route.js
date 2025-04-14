import express from 'express';
const requestRouter = express.Router();

import userAuth from '../middlewares/auth.js'
import ConnectionRequest from '../models/connectionRequest.model.js';
import User from '../models/user.model.js';

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

        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status,
        });

        const data = await connectionRequest.save();

        const statusMessage = status === "ignored" ? " ignored " : " is interested in ";

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