import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const signup = async (req, res, next) => {
    const { username, email, password } = req.body;
    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    try {
        await newUser.save();
        res.status(201).json('User created successfully.');
    } catch (error) {
        next(error);
    }
};

export const signin = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        /**
         * retrieve the user info if exists
         */
        const validUser = await User.findOne({ email });
        if (!validUser) return next(errorHandler(404, 'User not found!'));

        /**
         * compare the inputted password with the retrieved user info
         * since the pw is encrypted compareSync has to be used to hash the
         * inputted pw and compare it with the hashed pw in the user info
         */
        const validPassword = bcryptjs.compareSync(password, validUser.password);
        if (!validPassword) return next(errorHandler(401, 'Wrong credentials!'));


        /**
         * jwt is used to create a hashed token to save in the browser
         */
        const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);

        /**
         * destructure the valid user to send the user info without the pw
         * in the response
         */
        const {password: pass, ...rest} = validUser._doc;
        res.cookie('access_token', token, { httpOnly: true, }).status(200).json(rest);

    } catch (error) {
        next(error);
    }
};