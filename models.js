const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});

const CandidateCoverSchema = new mongoose.Schema({
    id: String,
    title: String,
    uploader: String,
    duration: Number,
    view_count: Number,
    like_count: Number,
    url: String,
    search_query: String,
    cover_num: Number,
    is_cover_votes: { type: Number, default: 0 },
    is_not_cover_votes: { type: Number, default: 0 },
    isCover: { type: Boolean, default: undefined },
    vote_timestamp: Date
});

const SongSchema = new mongoose.Schema({
    original_id: { type: String, required: true },
    original_title: String,
    original_search_query: String,
    candidate_covers: [CandidateCoverSchema],
    assigned_user: { type: String, default: 'others' } // To split data among users
});

const User = mongoose.model('User', UserSchema);
const Song = mongoose.model('Song', SongSchema);

module.exports = { User, Song };
