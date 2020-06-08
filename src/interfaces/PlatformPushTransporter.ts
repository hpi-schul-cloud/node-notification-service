import { messaging as firebaseMessaging } from 'firebase-admin';
import PlatformTransporter from '@/interfaces/PlatformTransporter';

export default interface PlatformPushTransporter extends PlatformTransporter {
	transporter: firebaseMessaging.Messaging;
}
