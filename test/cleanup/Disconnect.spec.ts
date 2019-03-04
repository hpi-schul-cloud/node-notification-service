import Shutdown from '@/helper/shutdown';
import logger from '@/helper/logger';

after('should drop database and close queue connections', (done) => {
	logger.info('global disconnect queues...');
	function disconnected() {
		logger.info('global disconnect queues finished');
		done();
	}
	Shutdown.queueShutdown().then(() => disconnected());
});
