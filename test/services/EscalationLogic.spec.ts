import 'mocha';
import chai from 'chai';
import spies from 'chai-spies';
import mongoose from 'mongoose';
import message from '@test/data/message';
import MessageService from '@/services/MessageService';
import DeviceService from '@/services/DeviceService';
import device from '@test/data/device';
import Utils from '@/utils';
import config from '@test/config';
import TestUtils from '@test/test-utils';

// Add extensions to chai
chai.use(spies);
const expect = chai.expect;

const SERVICE = 'firebase';

describe('EscalationLogic.escalate', () => {

	// Instantiate the service
	const messageService = new MessageService();

	before('should establish a database connection.', (done) => {
		// connect to database
		const db = mongoose.connection;
		// tslint:disable-next-line: no-console
		db.on('error', console.error.bind(console, 'connection error:'));
		db.once('open', done);
		mongoose.connect(config.MONGO_DB_PATH);
	});


	it('should call the escalation logic.', async () => {
		// add test device
		await DeviceService.addDevice(device.platform, device.userId, device.tokens[0], SERVICE);

		// use spies for push and mail service
		const spyFunctionPush = chai.spy();
		const spyFunctionMail = chai.spy();
		(await (messageService as any).escalationLogic.pushService).send = spyFunctionPush;
		(await (messageService as any).escalationLogic.mailService).send = spyFunctionMail;

		await messageService.send(message);

		// wait for async calls have been called
		await TestUtils.timeout(2000);
		expect(spyFunctionPush, 'push spy not executed')
			.to.have.been.called();

		const conf = await Utils.getPlatformConfig(message.platform);
		const delay = Array.isArray(conf.mail) ? conf.mail[0].defaults.delay : conf.mail.defaults.delay
		await TestUtils.timeout(delay + 1000);
		expect(spyFunctionMail, 'mail spy not executed')
			.to.have.been.called();
	});

	after('should drop database and close connection', (done) => {
		mongoose.connection.db.dropDatabase(() => {
			mongoose.connection.close(done);
		});
	});

});
