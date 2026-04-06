import { User } from "../models/User.js"
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb url';

async function seedData() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Clear existing data
        // await Hospital.deleteMany({});
        // await Ambulance.deleteMany({});
        // await CityGraph.deleteMany({});

        // console.log('🧹 Cleared existing data');

        const users = await User.create([
            {
                username: "admin",
                email: "admin56@gmail.com",
                password: "admin321",
                role: "admin"
            },

        ]);

        console.log(`🏥 Created ${users.length} admin`);
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedData()