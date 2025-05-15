import jwt from 'jsonwebtoken';
import User from '../models/user.model.js'

const userAuth = async (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).send("Please Login");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // const _id  = decoded._id;
        const { _id } = decoded;

        const user = await User.findById(_id).select("-password -verificationToken -verificationTokenExpiresAt -resetPasswordToken  -resetPasswordExpiresAt");

        if (!user) {
            throw new Error("User not found");
        }

        if(user.isVerified == false){
            return res.status(401).send("Please verify email");
        }

        req.user = user;  // add user in req object

        next();

    } catch (err) {
        res.status(401).json({
            success:false,
            message: err.message
        })
    }
}

export default userAuth;