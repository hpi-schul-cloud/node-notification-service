import { messaging as firebaseMessaging } from 'firebase-admin';
import PlatformTransporter from '@/interfaces/PlatformTransporter';

export default interface PlatformPushTransporter extends PlatformTransporter {
	platformId: string;
	transporter: firebaseMessaging.Messaging;
}
