import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const saltRounds = 10;
const secretKey = 'your_secret_key'; // Change this to a secure key and store it safely

export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
};

export const validatePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

export const createSessionToken = (userId) => {
    return jwt.sign({ id: userId }, secretKey, { expiresIn: '1h' }); // Token expires in 1 hour
};

export const verifySessionToken = (token) => {
    try {
        return jwt.verify(token, secretKey);
    } catch (error) {
        return null;
    }
};
