import BaseService from '@/services/BaseService';
import logger from '@/config/logger';

after('should drop database and close queue connections', (done) => {
	logger.info('global disconnect queues...');
	function disconnected() {
		logger.info('global disconnect queues finished');
		done();
	}
	BaseService.close().then(() => {
		disconnected();
	});
});
