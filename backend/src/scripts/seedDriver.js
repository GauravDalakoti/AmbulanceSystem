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

        console.log('🧹 Cleared existing data');

        // ========== HALDWANI HOSPITALS ==========
        const users = await User.create([
            {
               username:"Ramesh Kumar",
               email:"rameshd1@gmail.com",
               password:"ramesh123",
               role:"driver"
            },
            {
               username:"Amit Singh",
               email:"amitd2@gmail.com",
               password:"amit123",
               role:"driver"
            },
            {
               username:"Deepak Rawat",
               email:"deepakd3@gmail.com",
               password:"deepak123",
               role:"driver"
            }
        ]);

        console.log(`🏥 Created ${users.length} drivers`);
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedData()