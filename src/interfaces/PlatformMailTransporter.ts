import nodeMailer from 'nodemailer';

export default interface PlatformMailTransporter {
  platformId: string;
  transporter: nodeMailer.Transporter;
}
