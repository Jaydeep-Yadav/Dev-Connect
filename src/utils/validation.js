import validator from 'validator';

export const validateSignUpData = (req) => {
    const { firstName, lastName, emailId, password } = req.body;

    if (!firstName) {
        throw new Error("Firstname is not valid")
    } else if (!lastName) {
        throw new Error("Lastname is not valid")
    }
    else if (!validator.isEmail(emailId)) {
        throw new Error("Email is not valid");
    } else if (!validator.isStrongPassword(password)) {
        throw new Error("Please enter a strong password");
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