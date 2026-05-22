import { verifyJWT } from '../middleware/auth.middleware.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

import { Router } from 'express';
import { EmergencyRequest } from '../models/EmergencyRequest.js';
import { Ambulance } from '../models/Ambulance.js';
import { CityGraph } from '../models/CityGraph.js';

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
            secure: false, 
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


router.get('/logout', verifyJWT, async (req, res) => {
    try {
        await User.findByIdAndUpdate(

            req.user._id,
            {
                $unset: {
                    refreshToken: 1 
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

router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(userId);
        let objectId = new mongoose.Types.ObjectId(userId);
        const user = await User.findById(objectId).select('-password -refreshtoken');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(userId);
        let objectId = new mongoose.Types.ObjectId(userId);

        const totalEmergencies = await EmergencyRequest.countDocuments({ userId: objectId });

        // const pendingEmergencies = await EmergencyRequest.countDocuments({ status: 'PENDING' });
        const activeEmergencies = await EmergencyRequest.countDocuments({
            status: { $in: ['ASSIGNED', 'IN_TRANSIT', 'REACHED'] },
            userId: objectId
        });

        const completedEmergencies = await EmergencyRequest.countDocuments({
            status: 'COMPLETED',
            userId: objectId
        });

        res.json({
            success: true,
            data: {
                totalEmergencies,
                activeEmergencies,
                completedEmergencies
            }
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});


router.get('/ambulance/:ambulanceId/location', async (req, res) => {
    try {
        const { ambulanceId } = req.params;

        const ambulance = await Ambulance.findById(ambulanceId)
            .populate('driver', 'name phone');

        if (!ambulance) {
            return res.status(404).json({
                success: false,
                message: 'Ambulance not found'
            });
        }

      
        const graph = await CityGraph.findOne();
        const nodeCoords = graph?.nodes?.[ambulance.currentLocation]?.coordinates;

        res.json({
            success: true,
            data: {
                _id: ambulance._id,
                ambulanceNumber: ambulance.ambulanceNumber,
                currentLocation: ambulance.currentLocation,
                coordinates: nodeCoords,
                status: ambulance.status,
                driver: ambulance.driver
            }
        });

    } catch (error) {
        console.error('Error fetching ambulance location:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

router.get('/graph', async (req, res) => {
    try {
        const graph = await CityGraph.findOne();

        if (!graph) {
            return res.status(404).json({
                success: false,
                message: 'Graph not found'
            });
        }

        res.json({
            success: true,
            data: graph
        });

    } catch (error) {
        console.error('Error fetching graph:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

router.patch('/emergency/:emergencyId/cancel',verifyJWT, async (req, res) => {
    try {
        const { emergencyId } = req.params;
        // const { userId } = req.body;
        const userId=req.user?._id

        let objectId = new mongoose.Types.ObjectId(emergencyId);

        console.log("nbgjhg",emergencyId,userId);
        
        const emergency = await EmergencyRequest.findById(objectId);

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency not found'
            });
        }

        console.log(emergency);
        


        if (emergency.status === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed emergency'
            });
        }

   
        if (emergency.assignedAmbulanceId) {
            await Ambulance.findByIdAndUpdate(
                emergency.assignedAmbulanceId,
                { status: 'AVAILABLE' }
            );

            req.io.emit('ambulanceStatusUpdate', {
                ambulanceId: emergency.assignedAmbulanceId,
                status: 'AVAILABLE'
            });
        }

      
        emergency.status = 'CANCELLED';
     
        await emergency.save();

     
        req.io.emit('emergencyStatusUpdate', {
            emergencyId: emergency._id,
            status: 'CANCELLED'
        });

        res.json({
            success: true,
            message: 'Emergency cancelled successfully',
            data: emergency
        });

    } catch (error) {
        console.error('Error cancelling emergency:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

export default router;