import chai from 'chai';
import spies from 'chai-spies';
import 'mocha';
import PushService from '@/services/PushService';
import push from '@test/data/push';
import message from '@test/data/message';

// Add extensions to chai
chai.use(spies);
const expect = chai.expect;

describe('PushService.send', () => {

	// Instantiate the service
	const pushService = new PushService();
	const spyFunction = chai.spy();

	before('should create a mock push transporter.', async () => {
		const transporter = {
			send() {
				spyFunction();
				return Promise.resolve();
			},
		};

		// Add the custom transporter
		(pushService as any).transporters.push({
			platformId: message.platform,
			transporter,
		});

		// Send a push
		await pushService.send(message.platform, push, (push as any).token, 'noId');
	});

	it('should send a push.', () => {
		expect(spyFunction)
			.to.have.been.called();
	});

});
