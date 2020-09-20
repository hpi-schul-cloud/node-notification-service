import express from 'express';
import Admin from '@/services/Admin';
import Utils from '@/utils';

const router: express.Router = express.Router();
const admin = new Admin();

// TODO get last x entries, or entries from x to y with total size of 100
// TODO get open jobs from query
// TODO get statistics

router.get('/faildJobsByReceiver/:receiver', async (req, res) => {
	// TODO add shd key verification
	// validate regex
	if (Utils.parametersMissing(['receiver'], req.params, res)) {
		return;
	}

	try {
		const failedJobs = await admin.getFailedJobByReceiver(req.params.receiver);
		res.json({
			failedJobs,
		});
	} catch (err) {
		res.status(400).send(err.message);
	}
});

router.get('/failedJobs/', async (req, res) => {
	try {
		// from and until schema = 2020-09-09T08:50:51.181Z
		const failedJobs = await admin.getFailedJobByDate(req.query.from as any, req.query.until as any);
		res.json({
			failedJobs,
		});
	} catch (err) {
		res.status(400).send(err.message);
	}
});

router.get('/queryJobs/', async (req, res) => {
	try {
		const failedJobs = await admin.getQueryJops(req.query.start as any, req.query.end as any);
		res.json({
			failedJobs,
		});
	} catch (err) {
		res.status(400).send(err.message);
	}
});

router.get('/', (req, res) => {
	const data = {} as any;
	try {
		data.routes = router.stack.map((r) => ({
			path: r.route.path,
			methods: r.route.methods,
			keys: r.keys,
		}));
	} catch (err) {
		data.err = err;
	}
	res.status(200).json(data);
});

export default router;
