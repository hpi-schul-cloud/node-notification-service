import { Types } from 'mongoose';

export default interface Callback {
  userId: Types.ObjectId;
  createdAt: Date;
}
