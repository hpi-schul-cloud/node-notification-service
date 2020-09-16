import 'mocha';
import { expect } from 'chai';
import { messaging as firebaseMessaging } from 'firebase-admin';
import Mail from '@/interfaces/Mail';
import UserResource from '@/interfaces/UserResource';
import TemplatingService from '@/services/TemplatingService';
import message from '@test/data/message';

describe('TemplatingService.createMailMessage', () => {
	let mail: Mail;
	let messageId: string;
	let receiver: UserResource;
	let templatingService: TemplatingService;

	before('Instantiate the service', async () => {
		messageId = 'a1a2a3a4a5a6a7a8a9a0a1a2';
		templatingService = await TemplatingService.create(
			message.platform,
			message.template,
			message.payload,
			message.languagePayloads,
			messageId
		);
		receiver = message.receivers[0] as UserResource;
	});

	beforeEach('create a mail message.', async () => {
		mail = await templatingService.createMailMessage(receiver);
	});

	it('should create a valid mail.', () => {
		expect(mail).to.have.keys('from', 'to', 'subject', 'text', 'html');

		expect(mail.to).to.not.to.have.lengthOf(0);

		expect(mail.subject).to.not.to.have.lengthOf(0);

		expect(mail.text).to.not.to.have.lengthOf(0);

		expect(mail.html).to.not.to.have.lengthOf(0);
	});

	it('should replace placeholders with payload values (1).', () => {
		expect(mail.subject).to.equal(message.payload.title);

		expect(mail.text).to.equal(`Greetings ${receiver.payload.name}!`);

		const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
          <title>HTML Mail</title>
        </head>
        <body>
          <h1>${message.payload.title}</h1>
          <span>${message.languagePayloads[0].payload.description}</span>
          <p>Greetings ${receiver.payload.name}!</p>
        </body>
      </html>`;

		const regex = /[\s\n\r\t\0]/g;

		expect(mail.html.replace(regex, '')).to.equal(html.replace(regex, ''));
	});
});

describe('TemplatingService.createPushMessage', () => {
	let push: firebaseMessaging.Message;
	let messageId: string;
	let receiver: UserResource;
	let templatingService: TemplatingService;

	before('Instantiate the service', async () => {
		messageId = 'a1a2a3a4a5a6a7a8a9a0a1a3';
		templatingService = await TemplatingService.create(
			message.platform,
			message.template,
			message.payload,
			message.languagePayloads,
			messageId
		);
		receiver = message.receivers[0] as UserResource;
	});

	beforeEach('create a push message.', async () => {
		push = await templatingService.createPushMessage(receiver, 'test-device');
	});

	it('should create a valid push notification.', () => {
		expect(push).to.have.keys('token', 'data', 'notification', 'android', 'webpush', 'apns');
	});

	it('should replace placeholders with payload values (2).', () => {
		if (!push.notification) {
			expect(push.notification, 'Push template has no notification.').not.to.be.undefined;
			return;
		}

		expect(push.notification.title).to.equal(message.payload.title);

		expect(push.notification.body).to.equal(message.languagePayloads[0].payload.description);
	});
});

describe('TemplatingService.createMailMessage with callbackLink', () => {
	let mail: Mail;
	let messageId: string;
	let receiver: UserResource;
	let tpls: TemplatingService;

	before('Instantiate the service', async () => {
		messageId = 'a1a2a3a4a5a6a7a8a9a0a1a4';
		tpls = await TemplatingService.create(
			message.platform,
			'callback-link',
			message.payload,
			message.languagePayloads,
			messageId
		);
		receiver = message.receivers[0] as UserResource;
	});

	beforeEach('create a mail message.', async () => {
		mail = await tpls.createMailMessage(receiver);
	});

	it('should replace placeholders with payload values (3).', () => {
		expect(mail.subject).to.equal(message.payload.title);

		expect(mail.text).to.equal(`Greetings ${receiver.payload.name}!`);

		const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
          <title>HTML Mail</title>
        </head>
        <body>
          <h1>${message.payload.title}</h1>
          <a href="http://localhost:3100/notification/callback/${messageId}/seenBy/${receiver.userId}/?redirect=${message.payload.url}">Test Description</a>
          <p>Greetings ${receiver.payload.name}!</p>
        </body>
      </html>
      `;

		const regex = /[\s\n\r\t\0]/g;

		expect(mail.html.replace(regex, '')).to.equal(html.replace(regex, ''));
	});
});
