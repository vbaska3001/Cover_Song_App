require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const levenshtein = require('levenshtein');
const { User, Song } = require('./models');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

// Fuzzy match user
const findUser = async (inputName) => {
    const users = await User.find({});
    const normalizedInput = inputName.trim().toLowerCase();

    let bestMatch = 'others';
    let minDistance = Infinity;

    for (const user of users) {
        const name = user.name.toLowerCase();
        const distance = new levenshtein(normalizedInput, name).distance;

        if (distance < minDistance && distance <= 2) {
            minDistance = distance;
            bestMatch = user.name;
        }
    }

    return bestMatch;
};

// API: Login / Identify
app.post('/api/login', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    try {
        const assignedUser = await findUser(name);
        res.json({ user: assignedUser });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// API: Get Pair
app.get('/api/pair', async (req, res) => {
    const user = req.query.user;
    if (!user) return res.status(400).json({ error: "User required" });

    try {
        // Find songs assigned to this user
        // We need to find a song that has < 3 valid covers AND has at least one unvoted candidate
        // This is complex to query efficiently in one go, so we'll iterate or use aggregation if needed.
        // For simplicity with moderate data size:
        // Find all songs for user, then filter in code or use a smart query.

        // Query: assigned_user = user
        const songs = await Song.find({ assigned_user: user });

        // Iterate sequentially
        for (let i = 0; i < songs.length; i++) {
            const original = songs[i];
            if (!original.candidate_covers) continue;

            const validCoverCount = original.candidate_covers.filter(c => c.isCover === true).length;
            if (validCoverCount >= 3) continue;

            for (let j = 0; j < original.candidate_covers.length; j++) {
                const candidate = original.candidate_covers[j];

                if (candidate.isCover === undefined) {
                    return res.json({
                        original_id: original.original_id,
                        original_title: original.original_title,
                        candidate: candidate,
                        original_index: original._id, // Use _id for DB lookup
                        candidate_index: j // We still need index or ID to find subdoc
                    });
                }
            }
        }

        res.json({ message: "All pairs validated for this user!" });
    } catch (error) {
        console.error("Error getting pair:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// API: Vote
app.post('/api/vote', async (req, res) => {
    const { original_index, candidate_index, is_cover } = req.body; // original_index is now the Song _id

    try {
        const song = await Song.findById(original_index);
        if (!song || !song.candidate_covers[candidate_index]) {
            return res.status(404).json({ error: "Pair not found" });
        }

        const candidate = song.candidate_covers[candidate_index];

        if (!candidate.is_cover_votes) candidate.is_cover_votes = 0;
        if (!candidate.is_not_cover_votes) candidate.is_not_cover_votes = 0;

        if (is_cover) {
            candidate.is_cover_votes += 1;
        } else {
            candidate.is_not_cover_votes += 1;
        }

        candidate.isCover = candidate.is_cover_votes > candidate.is_not_cover_votes;
        candidate.vote_timestamp = new Date();

        await song.save();
        res.json({ success: true });

    } catch (error) {
        console.error("Error voting:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// API: Stats (Global)
app.get('/api/votes', async (req, res) => {
    try {
        // Aggregation to get all voted candidates
        const songs = await Song.find({ "candidate_covers.isCover": { $ne: null } });
        const votedPairs = [];

        songs.forEach(original => {
            original.candidate_covers.forEach(candidate => {
                if (candidate.isCover !== undefined) {
                    votedPairs.push({
                        user: original.assigned_user,
                        original_title: original.original_title,
                        candidate_title: candidate.title,
                        candidate_id: candidate.id,
                        is_cover: candidate.isCover,
                        votes_yes: candidate.is_cover_votes,
                        votes_no: candidate.is_not_cover_votes
                    });
                }
            });
        });

        res.json(votedPairs);
    } catch (error) {
        console.error("Error getting stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// API: Final List (Dynamic)
// We don't need to write to a file anymore, we can serve it on demand or user can just query DB.
// But if user wants a JSON download, we can provide an endpoint.
app.get('/api/final-list', async (req, res) => {
    try {
        const songs = await Song.find({ "candidate_covers.isCover": true });

        const finalData = songs.reduce((acc, item) => {
            const confirmedCovers = item.candidate_covers.filter(c => c.isCover === true);
            if (confirmedCovers.length > 0) {
                // Mongoose documents are immutable-ish, convert to object
                const newItem = item.toObject();
                newItem.candidate_covers = confirmedCovers;
                acc.push(newItem);
            }
            return acc;
        }, []);

        res.json(finalData);
    } catch (error) {
        res.status(500).json({ error: "Error generating list" });
    }
});

// API: Validated Covers (Full Dump)
app.get('/api/validated-covers', async (req, res) => {
    try {
        const songs = await Song.find({});
        res.json(songs);
    } catch (error) {
        console.error("Error getting validated covers:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Export for Vercel
module.exports = app;

// Only listen if not running in Vercel (Vercel handles the port)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
