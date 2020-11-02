import 'mocha';
import { expect } from 'chai';
import nodeMailer from 'nodemailer';
import configuration, { ConfigData } from '@/configuration';
import QueueManager from '@/services/QueueManager';
import MailService from '@/services/MailService';
import mail from '@test/data/mail';
import message from '@test/data/message';
import logger from '@/helper/logger';
import { cloneDeep } from 'lodash';

const EMAIL_SERVICE: string = process.env.MAIL_SERVICE || 'mailcatcher';

const SMTP_MAILCATCHER = {
	smtp: {
		host: process.env.MAILCATCHER_HOST || 'localhost',
		port: 1025,
		secure: false,
	},
	user: '',
	pass: '',
};

const getTestEmailAccount = async () => {
	let account;
	if (EMAIL_SERVICE === 'ethereal') {
		account = await nodeMailer.createTestAccount();
		logger.info('Use Ethereal Email: https://ethereal.email/', {
			smpt: account.smtp,
			user: account.user,
			pass: account.pass,
		});
	} else {
		account = SMTP_MAILCATCHER;
		logger.info('using mailcatcher for receiving emails in tests');
	}
	return account;
};

function getTestConfiguration(): ConfigData[] {
	const testConfig = cloneDeep(configuration.find((cfg) => cfg.platformId === 'testplatform') || {});
	// reset mail options
	testConfig.mail.options = [];
	return [testConfig];
}

async function addTestAccount(testConfiguration: ConfigData[]): Promise<ConfigData[]> {
	const account = await getTestEmailAccount();
	testConfiguration.forEach((config) => {
		config.mail.options.push({
			host: account.smtp.host,
			port: account.smtp.port,
			secure: account.smtp.secure,
			auth: {
				user: account.user,
				pass: account.pass,
			},
		});
	});
	return testConfiguration;
}

describe('MailService.send', () => {
	it('should send an e-mail, accepted by the receiver.', async () => {
		const testConfiguration = getTestConfiguration();
		await addTestAccount(testConfiguration);
		const mailService = new MailService(new QueueManager(), testConfiguration);
		// Send a mail
		const sentInfo = await mailService.directSend(message.platform, mail, mail.to, 'noId');
		expect(sentInfo.accepted).to.be.an('array').to.have.lengthOf(1).to.include(mail.to);
		expect(sentInfo.rejected).to.be.an('array').that.is.empty;
	});

	it('should send an mail, from the given sender.', async () => {
		const testConfiguration = getTestConfiguration();
		await addTestAccount(testConfiguration);
		await addTestAccount(testConfiguration);
		const mailService = new MailService(new QueueManager(), testConfiguration);
		// Send a mail
		const sentInfo = await mailService.directSend(message.platform, mail, mail.to, 'noId');
		expect(sentInfo.envelope).to.have.property('from', 'bounce@sample.org');
	});

	// it('should reactivate a random transporter', async () => {
	// 	// Create mail accounts
	// 	const transporterOne: PlatformMailTransporter = await configureEmailAccount(mailService);
	// 	const transporterTwo: PlatformMailTransporter = await configureEmailAccount(mailService);

	// 	// make both account unavailable
	// 	transporterOne.unavailableSince = new Date();
	// 	transporterTwo.unavailableSince = new Date();

	// 	// Send a mails
	// 	await mailService.directSend(message.platform, mail, mail.to, 'noId');
	// 	await mailService.directSend(message.platform, mail, mail.to, 'noId');
	// 	await mailService.directSend(message.platform, mail, mail.to, 'noId');

	// 	// all Mails have been send using transporterTwo
	// 	console.log('transporterOne.lastSuccessAt', transporterOne.lastSuccessAt);
	// 	console.log('transporterTwo.lastSuccessAt', transporterTwo.lastSuccessAt);
	// });

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
