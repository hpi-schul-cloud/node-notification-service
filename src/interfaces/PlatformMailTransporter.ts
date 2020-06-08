import nodeMailer from 'nodemailer';
import PlatformTransporter from '@/interfaces/PlatformTransporter';

export default interface PlatformMailTransporter extends PlatformTransporter {
	platformId: string;
	transporter: nodeMailer.Transporter;
}
