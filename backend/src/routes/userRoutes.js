import { verifyJWT } from '../middleware/auth.middleware.js';
import { User } from '../models/User.js';

import { Router } from 'express';

const router = Router()

const generateAccessAndRefreshToken = async (userId) => {

    try {

        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {

        return res.status(500).json({ error: 'Something went wrong while generating access and refresh tokens' });
    }
}

// register
router.post('/register', async (req, res) => {
    console.log("jghggghgfhfghfgfgh");

    try {
        const { username, email, password } = req.body;

        if ([username, email, password].some(field => !field)) {
            return res.status(400).json({ error: 'All Field Are Required' });
        }

        const isAlreadyExisted = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (isAlreadyExisted) {
            return res.status(400).json({ error: 'User With already exist' });
        }

        await User.create({
            username,
            email,
            password,
            role: "user",
        });

        return res.status(201).json("register successfully");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await user.isPasswordCorrect(password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        const cookieOptions = {
            httpOnly: true,
            secure: false, // true in production
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(loggedInUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// logout
router.get('/logout', verifyJWT, async (req, res) => {
    try {
        await User.findByIdAndUpdate(

            req.user._id,
            {
                $unset: {
                    refreshToken: 1 // this removes the field from document
                }
            },
            {
                new: true
            }
        )

        const options = {

            httpOnly: true,
            secure: true,
            sameSite: "none",
        }

        return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json("User logout Successfully")

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;