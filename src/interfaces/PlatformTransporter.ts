import nodeMailer from 'nodemailer';

export default interface PlatformTransporter {
  platformId: string;
  transporter: nodeMailer.Transporter;
}
