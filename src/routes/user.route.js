import express from 'express';
const userRouter = express.Router();

import userAuth from '../middlewares/auth.js'
import ConnectionRequest from '../models/connectionRequest.model.js';
import User from '../models/user.model.js';

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";

function shuffleUsers(users) {
    for (let i = users.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [users[i], users[j]] = [users[j], users[i]]; // Swap elements
    }
    return users;
}

// Get all the pending connection request for the loggedIn user
userRouter.get("/user/requests/received", userAuth, async (req, res) => {

    try {
        const loggedInUser = req.user;

        const connectionRequests = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status: "interested"
        }).populate("fromUserId", USER_SAFE_DATA);

        res.json({
            message: "Data fetched Successfully",
            data: connectionRequests
        })

    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
})

userRouter.get("/user/connections", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        const connectionRequests = await ConnectionRequest.find({
            $or: [
                { toUserId: loggedInUser._id, status: "accepted" },
                { fromUserId: loggedInUser._id, status: "accepted" },
            ]
        })
            .populate("fromUserId", USER_SAFE_DATA)
            .populate("toUserId", USER_SAFE_DATA);

        // filter connected users from connectionRequest records
        const data = connectionRequests.map((row) => {
            if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
                return row.toUserId;
            }
            return row.fromUserId;
        })

        res.json({ data })

    } catch (err) {
         res.status(400).json({
            success: false,
            message: err.message,
        });
    }
})

userRouter.get("/feed", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        // save last seen in lastLogin field
        loggedInUser.lastLogin = Date.now();

        //Pagination
        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 50 ? 50 : limit;
        const skip = (page - 1) * limit;

        const connectionRequests = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id }
            ]
        }).select("fromUserId toUserId");

        // create list of users from existing connection requets, to exclude from feed
        const excludeUsersFromFeed = new Set();

        connectionRequests.forEach((req) => {
            excludeUsersFromFeed.add(req.fromUserId.toString());
            excludeUsersFromFeed.add(req.toUserId.toString());
        });


        // fetch users who havent sent / havent received your request && exclude self profile
        let users = await User.find({
            $and: [
                { _id: { $nin: Array.from(excludeUsersFromFeed) } },
                { _id: { $ne: loggedInUser._id } },
            ],
        })
            .select(USER_SAFE_DATA)
            .skip(skip)
            .limit(limit);

        users = shuffleUsers(users);

        res.json({ data: users });

    } catch (err) {
        res.status(400).send(err.message);
    }
})

export default userRouter;