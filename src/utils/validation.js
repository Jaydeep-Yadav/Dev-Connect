import validator from 'validator';

export const validateSignUpData = (req) => {
    const { firstName, lastName,gender, emailId, password } = req.body;

    if (!firstName || !lastName) {
        throw new Error("Name is not valid")
    } else if (!validator.isEmail(emailId)) {
        throw new Error("Email is not valid");
    } else if (!validator.isStrongPassword(password)) {
        throw new Error("Please enter a strong password");
    }else if(!["male", "female", "other"].includes(gender)){
        throw new Error("Gender is not valid")

    }
}

export const validateEditProfileData = (req) => {
    const allowedEditFields = [
        "firstName",
        "lastName",
        "emailId",
        "photoUrl",
        "gender",
        "age",
        "about",
        "skills"
    ];

    const isEditAllowed = Object.keys(req.body).every((field) => allowedEditFields.includes(field))

    return isEditAllowed;
}