require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { User, Song } = require('./models');

const DATA_FILE = path.join(__dirname, 'data', 'covers.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

const migrate = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("Error: MONGODB_URI not found in .env file");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Clear existing data (optional, but good for clean migration)
        await User.deleteMany({});
        await Song.deleteMany({});
        console.log("Cleared existing collections");

        // 1. Migrate Users
        const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const userDocs = await User.insertMany(usersData);
        console.log(`Migrated ${userDocs.length} users`);

        // 2. Migrate Songs and Assign Users
        const songsData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

        // Deduplicate logic (reused)
        songsData.forEach(item => {
            if (item.candidate_covers) {
                const unique = [];
                const seen = new Set();
                item.candidate_covers.forEach(cover => {
                    if (!seen.has(cover.id)) {
                        seen.add(cover.id);
                        unique.push(cover);
                    }
                });
                item.candidate_covers = unique;
            }
        });

        // Distribute songs
        const userNames = usersData.map(u => u.name);
        // We have users + 'others'
        const buckets = [...userNames, 'others'];
        const chunkSize = Math.ceil(songsData.length / buckets.length);

        const songsToInsert = songsData.map((song, index) => {
            const bucketIndex = Math.floor(index / chunkSize);
            const assignedUser = buckets[bucketIndex] || 'others';
            return { ...song, assigned_user: assignedUser, song_number: index + 1 };
        });

        await Song.insertMany(songsToInsert);
        console.log(`Migrated ${songsToInsert.length} songs`);

        console.log("Migration complete!");
        process.exit(0);

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
