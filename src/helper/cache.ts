import NodeCache from 'node-cache';
import logger from './logger';

class Cache {

	private cache: NodeCache;

	constructor(ttlSeconds: number) {
		const options = {
			stdTTL: ttlSeconds,
			checkperiod: ttlSeconds * 0.2,
			useClones: false,
		};
		logger.debug('[cache] setup cache...', options);
		this.cache = new NodeCache(options);
	}

	public get(key: string, storeFunction: any) {
		logger.debug(`[cache] try loading '${key}' from cache...`);
		const value = this.cache.get(key);
		if (value) {
			logger.debug(`[cache] resolve '${key}' from cache...`);
			return value;
		}

		logger.debug(`[cache] resolve '${key}' from storeFunction...`);
		return storeFunction().then((result: any) => {
			this.cache.set(key, result);
			return result;
		});
	}

	public del(keys: string | string[]) {
		logger.debug(`[cache] remove '${keys}' from cache...`);
		this.cache.del(keys);
	}

	public flush() {
		logger.debug(`[cache] flush cache...`);
		this.cache.flushAll();
	}
}


export default Cache;
