import Device from '@/interfaces/Device';
import mongoose from 'mongoose';

const device: Device = {
	platform: 'testplatform',
	userId: mongoose.Types.ObjectId('4ede40c86362e0fb12000003'),
	tokens: ['nyht4ca81bGam26a'],
	service: 'firebase',
};

export default device;
