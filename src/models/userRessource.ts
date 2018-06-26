import mongoose from 'mongoose';

export default new mongoose.Schema({
    name: String,
    mail: String,
    language: String,
    payload: Object,
});
