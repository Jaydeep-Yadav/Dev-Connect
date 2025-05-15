import express from 'express';
import userAuth from '../middlewares/auth.js'
import upload from '../middlewares/multer.js';
import cloudinary from "../config/cloudinary.js"
import getDataUri from "../utils/datauri.js";
import { validateEditProfileData } from "../utils/validation.js"
import { deleteFromCloudinary } from '../config/cloudinary.js'

const profileRouter = express.Router();

profileRouter.get("/profile/view", userAuth, async (req, res) => {
    try {
        // userAuth has pushed user in req object
        const user = req.user;

        res.send(user);

    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
})

profileRouter.patch("/profile/edit", userAuth, upload.single('photoUrl'), async (req, res) => {
    try {
        if (!validateEditProfileData(req)) {
            throw new Error("Invalid Edit Request");
        }

        if (req.body.age < 18 || req.body.age > 100) {
            throw new Error("Invalid Age: 18 - 100 allowed");
        }

        const loggedInUser = req.user;

        //! for uploading profile picture
        const profilePicture = req.file;

        let cloudResponse;
        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            const folder = process.env.APP_NAME + "/Profile Picture";


            // Upload new profile picture //
            cloudResponse = await cloudinary.uploader.upload(fileUri, {
                folder: folder
            });

            deleteFromCloudinary(loggedInUser.photoUrl);
        }

        loggedInUser.photoUrl = cloudResponse?.secure_url;


        //! For updating skills array
        const parsedSkills = JSON.parse(req.body.skills);


        Object.keys(req.body).forEach((key) => {
            if (key === "skills") {
                loggedInUser.skills = parsedSkills;
            } else {
                loggedInUser[key] = req.body[key];
            }
        });


        await loggedInUser.save();

        res.json({
            message: `${loggedInUser.firstName}, your profile updated successfuly`,
            data: loggedInUser,
        });

    } catch (err) {
        res.status(400).send(err.message);
    }
})

export default profileRouter;