import mongoose from 'mongoose';

export default interface UserResource {
  name: string;
  mail: string;
  userId: mongoose.Types.ObjectId;
  payload: any;
  language: string;
  preferences: {
  [key: string]: boolean;
};
}
