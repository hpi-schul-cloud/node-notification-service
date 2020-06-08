import 'mocha';
import { expect } from 'chai';
import nodeMailer from 'nodemailer';
import MailService from '@/services/MailService';
import mail from '@test/data/mail';
import message from '@test/data/message';
import logger from '@/helper/logger';
import PlatformMailTransporter from "../../src/interfaces/PlatformMailTransporter";

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
		logger.info('using mailcatcher for receiving emails in tests')
	}
	return account;
}

const configureEmailAccount = async (mailService : MailService) => {
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
	const mailTransporter = {
		platformId: message.platform,
		transporter,
	};
	(mailService as any).transporters.push(mailTransporter);
	return mailTransporter;
}

describe('MailService.send', () => {

	// Instantiate the service
	const mailService: MailService = new MailService();

	beforeEach('should send an mail.', async () => {
		// Clear transporters
		(mailService as any).transporters = [];
	});

	it('should send an mail, accepted by the receiver.', async () => {
		// Create mail account
		await configureEmailAccount(mailService);

		// Send a mail
		const messageInfo : any = await mailService.directSend(message.platform, mail, mail.to, 'noId');

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
		// Create mail account
		await configureEmailAccount(mailService);
		await configureEmailAccount(mailService);

		// Send a mail
		const messageInfo : any = await mailService.directSend(message.platform, mail, mail.to, 'noId');

		expect(messageInfo.envelope)
			.to.have.property('from', mail.from);
	});

	it('should reactivate a random transporter', async () => {
		// Create mail accounts
		const transporterOne: PlatformMailTransporter = await configureEmailAccount(mailService);
		const transporterTwo: PlatformMailTransporter = await configureEmailAccount(mailService);

		// make both account unavailable
		transporterOne.unavailableSince = new Date();
		transporterTwo.unavailableSince = new Date();

		// Send a mails
		await mailService.directSend(message.platform, mail, mail.to, 'noId');
		await mailService.directSend(message.platform, mail, mail.to, 'noId');
		await mailService.directSend(message.platform, mail, mail.to, 'noId');

		// all Mails have been send using transporterTwo
		console.log('transporterOne.lastSuccessAt', transporterOne.lastSuccessAt);
		console.log('transporterTwo.lastSuccessAt', transporterTwo.lastSuccessAt);
	});

	// TODO: Enable again when logic to avoid using unavailable transporters for one hour was activated
	// it('should send all mails using transporterTwo.', async () => {
	// 	// Create mail accounts
	// 	const transporterOne: PlatformMailTransporter = await configureEmailAccount(mailService);
	// 	const transporterTwo: PlatformMailTransporter = await configureEmailAccount(mailService);
	//
	// 	// make one account unavailable
	// 	transporterOne.unavailableSince = new Date();
	//
	// 	// Send mails
	// 	await mailService.directSend(message.platform, mail, mail.to, 'noId');
	// 	await mailService.directSend(message.platform, mail, mail.to, 'noId');
	// 	await mailService.directSend(message.platform, mail, mail.to, 'noId');
	//
	// 	// all Mails have been send using transporterTwo
	// 	expect(transporterTwo.lastSuccessAt)
	// 		.to.be.an('Date');
	// 	expect(transporterOne.lastSuccessAt)
	// 		.to.be.undefined;
	// });
	//
	// it('should reactivate transporterOne', async () => {
	// 	// Create mail accounts
	// 	const transporterOne: PlatformMailTransporter = await configureEmailAccount(mailService);
	// 	const transporterTwo: PlatformMailTransporter = await configureEmailAccount(mailService);
	//
	// 	// make both account unavailable
	// 	transporterOne.unavailableSince = new Date(new Date().getTime() - (2 * 60 * 60 * 1000)); // 2 hours ago
	// 	transporterTwo.unavailableSince = new Date();
	//
	// 	// Send a mails
	// 	await mailService.directSend(message.platform, mail, mail.to, 'noId');
	// 	await mailService.directSend(message.platform, mail, mail.to, 'noId');
	// 	await mailService.directSend(message.platform, mail, mail.to, 'noId');
	//
	// 	// all Mails have been send using transporterOne
	// 	expect(transporterOne.lastSuccessAt)
	// 		.to.be.an('Date');
	// 	expect(transporterOne.unavailableSince)
	// 		.to.be.undefined;
	// 	expect(transporterTwo.lastSuccessAt)
	// 		.to.be.undefined;
	// });

});
