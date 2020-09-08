import express from 'express';
import FailedJobService from '@/services/FailedJobService';
import Utils from '@/utils';

const router: express.Router = express.Router();
const failedJobService = new FailedJobService();

router.get('/:receiver', async (req, res) => {

    // TODO add shd key verification
    // validate regex
	if (Utils.parametersMissing(['receiver'], req.params, res)) { return; }

	try {
        const jobs = await failedJobService.getJobByReceiver(req.params.receiver);
        res.json({
            jobs,
        })
	} catch (err) {
		res.status(400).send(err.message);
    }
    
    // TODO get last x entries, or entries from x to y with total size of 100

    // TODO get statistics 
});

export default router;