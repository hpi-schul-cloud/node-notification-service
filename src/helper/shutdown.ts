import logger from './logger';
import BaseService from '@/services/BaseService';
import { Server } from 'http';

class Shutdown {
	public static queueShutdown = () => {
		return new Promise((resolve, reject) => {
			logger.info('[shutdown] close message queue instances...');
			return BaseService.close().then(() => {
				logger.info('[shutdown] closed message queue instances.');
				return resolve();
			});
		});
	};
	public static httpShutdown = (instance: Server) => {
		return new Promise((resolve, reject) => {
			logger.info('[shutdown:http] close http connections...');
			return instance.close(() => {
				logger.info('[shutdown:http] http connections closed.');
				resolve();
			});
		});
	};
}

export default Shutdown;
