import express from 'express';
import { validateSignUpData } from '../utils/validation.js';
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import sendEmail from "../utils/mailer.js"
import crypto from 'crypto'
import userAuth from '../middlewares/auth.js';
import { UAParser } from 'ua-parser-js';
const authRouter = express.Router();
import validator from 'validator';

authRouter.post("/signup", async (req, res) => {
    try {

        //validate sign up data
        validateSignUpData(req);

        const { firstName, lastName, emailId, password } = req.body;

        // Check if User Exists
        const userExists = await User.findOne({ emailId: emailId });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email !",
            })
        }

        // Encrypt the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate random verification token
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Create new instance of User Model
        const user = await User.create({
            firstName,
            lastName,
            emailId,
            password: passwordHash,
            verificationToken,
            verificationTokenExpiresAt: tokenExpiry
        })


        const createdUser = await User.findById(user._id)

        if (!createdUser) {
            return res.status(500).json({
                success: false,
                message: "Something went wrong while registering the user"
            })
        }

        // token for user email verification after sign up //
        const token = await createdUser.getJWT();

        res.cookie("token", token, {
            expires: new Date(Date.now() + 8 * 3600000)
        })

        //! Send verification email //
        await sendEmail(createdUser.emailId, "VERIFICATION", verificationToken);

        res.status(201).json({
            success: true,
            message: "User registered. \nCheck email to verify (Please check Spam Emails) !",
        })

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
})

authRouter.post("/verify/:code", async (req, res) => {
    const { code } = req.params;

    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() },
        });


        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification code.\nPlease Login again !" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        //! sendWelcomeEmail //
        await sendEmail(user.emailId, "USER_WELCOME", user.firstName);

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            data: user

        });

    } catch (error) {
        console.log("Error in Email Verification", error);
        res.status(500).send(error?.message);
    }
})

authRouter.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if (!emailId || !password) {
            return res.status(400).json({
                success: true,
                message: "Email or Password is empty"
            })
        }

        const user = await User.findOne({ emailId: emailId });

        if (!user) {
            return res.status(400).json({
                success: true,
                message: "Invalid credentials"
            })
        }

        const isPasswordValid = await user.validatePassword(password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: true,
                message: "Invalid credentials"
            })
        }

        if (user.isVerified == false) {

            const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
            const tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

            user.verificationToken = verificationToken;
            user.verificationTokenExpiresAt = tokenExpiry;
            await user.save();

            return res.status(401).json({
                success: true,
                message: "Please verify the email"
            })
        }

        const token = await user.getJWT();

        res.cookie("token", token, {
            expires: new Date(Date.now() + 8 * 3600000)
        })

        //TODO: User logged in mail
        // Extract User-Agent from request headers
        const userAgent = req.headers['user-agent'];
        const deviceInfo = UAParser(userAgent);

        const deviceDetails = {
            browser: deviceInfo.browser.name,
            browserVersion: deviceInfo.browser.version,
            os: deviceInfo.os.name,
            osVersion: deviceInfo.os.version,
            device: deviceInfo.device.vendor ? `${deviceInfo.device.vendor} ${deviceInfo.device.model}` : "Unknown Device",
        };

        // console.log("Device Details:", deviceDetails);

        // Send email with device details
        await sendEmail(user.emailId, "USER_LOGIN", deviceDetails);


        return res.send(user);
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        })
    }
});



authRouter.post("/logout", async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now())
    });

    // res.status(200).send("Logout successfull !");
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    })
})


authRouter.post("/forgot-password", async (req, res) => {

    const { emailId } = req.body;

    try {
        const user = await User.findOne({ emailId });

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;

        await user.save();

        //! send password reset email
        const resetLink = `${process.env.HOST}/reset-password/${resetToken}`
        await sendEmail(user.emailId, "FORGOT_PASSWORD", resetLink);

        res.status(200).json({ success: true, message: "Password reset link sent to your email" });
    } catch (error) {
        console.log("Error in forgotPassword ", error);
        res.status(400).json({ success: false, message: error.message });
    }
})

authRouter.post("/change-password", userAuth, async (req, res) => {

    try {

        const loggedInUser = req.user;
        const { password } = req.body;
        console.log(loggedInUser);
        const user = await User.findOne({
            _id: loggedInUser._id
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Please Log In"
            });
        }

        const isPasswordSame = await user.validatePassword(password);

        if (isPasswordSame) {
            return res.status(400).json({
                success: false,
                message: "New Password is same as Old Password"
            });
        }

        if(!validator.isStrongPassword(password)){
             return res.status(400).json({
                success: false,
                message: "Please enter a strong password"
            });
        }

        // update password
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();

        //! Send Password reset successful email //
        await sendEmail(user.emailId, "PASSWORD_CHANGED", user.firstName);
        // await sendEmail(user.emailId, "USER_LOGIN", deviceDetails);

        return res.status(200).json({
            success: true,
            message: "Password changed successfully\n Redirecting to Home Page"
        });


    } catch (error) {
        console.log("Error in Resetting Password ", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }

})

authRouter.post("/reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: "Token or Password missing"
            })
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        const isPasswordSame = await user.validatePassword(password);

        if (isPasswordSame) {
            return res.status(400).json({
                success: false,
                message: "New Password is same as Old Password"
            });
        }

         if(!validator.isStrongPassword(password)){
             return res.status(400).json({
                success: false,
                message: "Please enter a strong password"
            });
        }

        // update password
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();

        //! Send Password reset successful email //
        await sendEmail(user.emailId, "PASSWORD_CHANGED", user.firstName);

        return res.status(200).json({
            success: true,
            message: "Password reset successful\n Redirecting to login page"
        });

    } catch (error) {
        console.log("Error in Resetting Password ", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
})

export default authRouter;