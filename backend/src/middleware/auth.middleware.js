import jwt from "jsonwebtoken"
import { User } from "../models/User.js";

const verifyJWT = async (req, res, next) => {

    try {

        const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {

            return res.status(404).json({ error: 'Unauthorized Request' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {

            return res.status(401).json({ error: 'Invalid Access Token' });
        }

        req.user = user
        next()

    } catch (error) {

        return res.status(401).json({ error: 'Invalid Access Token' });
    }
}

export { verifyJWT }