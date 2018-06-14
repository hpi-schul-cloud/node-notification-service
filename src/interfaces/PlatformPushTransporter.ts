import admin from 'firebase-admin';

export default interface PlatformPushTransporter {
  platformId: string;
  transporter: admin.app.App;
}
