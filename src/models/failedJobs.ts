import mongoose from 'mongoose';

export const failedJobSchema = new mongoose.Schema({
	jobId: Number,
	data: Object,
	error: Object,
});

const failedJobModel = mongoose.model('failedJob', failedJobSchema);

export default failedJobModel;
