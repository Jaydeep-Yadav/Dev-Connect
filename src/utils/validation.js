import validator from 'validator';

export const validateSignUpData = (req) => {
    const { firstName, lastName, emailId, password } = req.body;

    if (!firstName || !isAlphabetOnly(firstName)) {
        throw new Error("Firstname is not valid")
    } else if (firstName.length < 3) {
        throw new Error("First Name should be more than 3 letters")
    }
    else if (!lastName || !isAlphabetOnly(lastName)) {
        throw new Error("Last Name is not valid")
    } else if (lastName.length < 3) {
        throw new Error("firstName should be more than 3 letters")
    }
    else if (!validator.isEmail(emailId)) {
        throw new Error("Email is not valid");
    } else if (!validator.isStrongPassword(password)) {
        throw new Error("Please enter a strong password");
    }

}

function isAlphabetOnly(str) {
    return /^[A-Za-z]+$/.test(str);
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