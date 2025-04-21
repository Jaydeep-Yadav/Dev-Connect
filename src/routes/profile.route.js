import express from 'express';
const profileRouter = express.Router();


import userAuth from '../middlewares/auth.js'
import { validateEditProfileData } from "../utils/validation.js"
import validator from 'validator';

profileRouter.get("/profile/view", userAuth, async (req, res) => {
    try {
        // userAuth has pushed user in req object
        const user = req.user;

        res.send(user);

    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
})

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
    try {
        if (!validateEditProfileData(req)) {
            throw new Error("Invalid Edit Request");
        }

        if (req.body.age < 18 || req.body.age > 100) {
            throw new Error("Invalid Age: 18 - 100 allowed");
        }

        // if (!validator.isURL(req.body.photoUrl)) {
        //     throw new Error("Photo URL is not valid");
        // }

        const loggedInUser = req.user;

        Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

        loggedInUser.save();

        res.json({
            message: `${loggedInUser.firstName}, your profile updated successfuly`,
            data: loggedInUser,
        });

    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
})

export default profileRouter;