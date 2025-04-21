import express from 'express';

const authRouter = express.Router();

import { validateSignUpData } from '../utils/validation.js';
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';

authRouter.post("/signup", async (req, res) => {
    try {
        //validate sign up data
        validateSignUpData(req);

        const { firstName, lastName, gender, emailId, password } = req.body;

        // Check if User Exists
        const userExists = await User.findOne({ emailId: emailId });

        if (userExists) {
            return res.json({
                message: "User already exists with this email !",
            })
        }

        // Encrypt the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create new instance of User Model
        const user = await User.create({
            firstName,
            lastName,
            gender,
            emailId,
            password: passwordHash
        })


        const createdUser = await User.findById(user._id).select("-password");

        if (!createdUser) {
            return res.status(500).json({
                message: "Something went wrong while registering the user"
            })
        }
        
        // to login the user automatically after sign up //
        const token = await createdUser.getJWT();

        res.cookie("token", token, {
            expires: new Date(Date.now() + 8 * 3600000)
        })

        res.status(200).json({
            message: "User added successfully !",
            data: createdUser
        })

    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
})

authRouter.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if(!emailId || !password){
            throw new Error("Incomplete credentials");
        }

        const user = await User.findOne({ emailId: emailId });

        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isPasswordValid = await user.validatePassword(password);

        if (isPasswordValid) {
            const token = await user.getJWT();

            res.cookie("token", token, {
                expires: new Date(Date.now() + 8 * 3600000)
            })

            res.send(user);
        } else {
            throw new Error("Invalid credentials")
        }
    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
})

authRouter.post("/logout", async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now())
    });

    res.send("Logout successfull !")
})
export default authRouter;