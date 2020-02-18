import 'mocha';
import { expect } from 'chai';
import nodeMailer from 'nodemailer';
import MailService from '@/services/MailService';
import mail from '@test/data/mail';
import message from '@test/data/message';
import logger from '@/helper/logger';
import { doesIntersect } from 'tslint';

const EMAIL_SERVICE: string = process.env.MAIL_SERVICE || 'mailcatcher';

const SMTP_MAILCATCHER: any = {
	smtp: {
		host: process.env.MAILCATCHER_HOST || 'localhost',
		port: 1025,
		secure: false
	},
	user: '',
	pass: '',
};

const getTestEmailAccount = async ({ EMAIL_SERVICE }: any) => {
	let account: any = null;
	if (EMAIL_SERVICE === 'ethereal') {
		account = await nodeMailer.createTestAccount();
		logger.info('Use Ethereal Email: https://ethereal.email/',
			{ smpt: account.smtp, user: account.user, pass: account.pass }
		);
	} else {
		account = SMTP_MAILCATCHER;
		logger.info('using mailcatcheer for receiving emails in tests')
	}
	return account;
}

describe('MailService.send', () => {

	// Instantiate the service
	const mailService: MailService = new MailService();
	let messageInfo: any;

	before('should send an mail.', async () => {
		// Create ethereal mail account
		const account: any = await getTestEmailAccount({ EMAIL_SERVICE });
		const { host, port, secure } = account.smtp;
		const { user, pass } = account;
		const transporter = nodeMailer.createTransport({
			host,
			port,
			secure,
			auth: {
				user,
				pass
			}
		});

		// Add the custom transporter
		(mailService as any).transporters.push({
			platformId: message.platform,
			transporter,
		});

		// Send a mail
		messageInfo = await mailService.directSend(message.platform, mail, mail.to, 'noId');
	});

	it('should send an mail, accepted by the receiver.', async () => {
		expect(messageInfo.accepted)
			.to.be.an('array')
			.to.have.lengthOf(1)
			.to.include(mail.to);

		expect(messageInfo.rejected)
			.to.be.an('array')
			.that.is.empty
			.to.not.include(mail.to);
	});

	it('should send an mail, from the given sender.', async () => {
		expect(messageInfo.envelope)
			.to.have.property('from', mail.from);
	});

});
