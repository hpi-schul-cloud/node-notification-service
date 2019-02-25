import mongoose from 'mongoose';
export default interface Device {
	platform: string;
	userId: mongoose.Types.ObjectId;
	tokens: string[];
	service: string;
}
