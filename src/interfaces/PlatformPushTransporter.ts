import firebaseAdmin from 'firebase-admin';

export default interface PlatformPushTransporter {
  platformId: string;
  transporter: firebaseAdmin.app.App;
}
