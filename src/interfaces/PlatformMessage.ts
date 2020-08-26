import Mail from '@/interfaces/Mail';
import {messaging as firebaseMessaging} from 'firebase-admin';

export type PlatformMessage = Mail | firebaseMessaging.Message;
