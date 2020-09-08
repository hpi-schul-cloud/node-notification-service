import { Document, Schema, Model, model } from 'mongoose';
import FailedJob from '@/interfaces/FailedJob';

export interface IFailedJobModel extends FailedJob, Document {}

export const failedJobSchema = new Schema({
	receiver: { type: String, required: true },
	jobId: { type: Number, required: true },
	data: { type: Object },
	error: { type: Object, required: true },
}, {
	timestamps: true, 
});

const FailedJobModel: Model<IFailedJobModel> = model('failedJob', failedJobSchema);

export default FailedJobModel;
