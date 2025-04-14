import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import 'dotenv/config';

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 50
    },
    lastName: {
        type: String,
        minLength: 2,
        maxLength: 50
    },
    emailId: {
        type: String,
        lowercase: true,
        required: true,
        unique: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid email address: " + value);
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isStrongPassword(value)) {
                throw new Error("Enter a Strong Password: " + value);
            }
        }
    },
    age: {
        type: Number,
        min: 18,
        max: 100
    },
    gender: {
        type: String,
        enum: {
            values: ["male", "female", "other"],
            message: `{VALUE} is not a valid gender type`
        }
    },
    photoUrl: {
        type: String,
        default: "https://geographyandyou.com/images/user-profile.png",
        validate(value) {
            if (!validator.isURL(value)) {
                throw new Error("Invalid Photo URL: " + value);
            }
        }
    },
    about: {
        type: String,
        default: "This is a default about of user!"
    },
    skills: {
        type: [String]
    }
},
    {
        timestamps: true
    })

userSchema.methods.getJWT = async function(){
    const user = this;

    // Create Token - const token = jwt.sign( {data: 'hiddendata'} , 'secret', { expiresIn: '1h' });
    // Decode Token - var decoded = jwt.verify(token, 'shhhhh');
    // console.log(decoded.data) // hiddendata

    const token = jwt.sign( {_id: user._id}, process.env.JWT_SECRET , {
        expiresIn: "7d"
    })

    return token;
}

userSchema.methods.validatePassword = async function (passwordInputByUser){
    const user = this;
    const passwordHash = user.password;

    const isPasswordValid = await bcrypt.compare(passwordInputByUser, passwordHash);

    return isPasswordValid;
}

const User = mongoose.model("User", userSchema);

export default User;