import { messaging as firebaseMessaging } from 'firebase-admin';

const push: firebaseMessaging.Message = {
	token: 'nms76vghyXGFa652chgagvhy56c1zc7vxghSWq',
	data: {},
	notification: {
		title: 'New foo bar available',
		body: 'Order our new foo bar for only $42.',
	},
	android: {},
	webpush: {},
	apns: {},
};

export default push;
