import fs from 'fs';
import path from 'path';
import defaults from 'defaults-deep';
import logger from '@/helper/logger';

function loadPlatformIds(cfgPath: string): string[] {
	const platformIds = fs
		.readdirSync(cfgPath, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);
	return platformIds;
}

function loadCfgDefault(cfgPath: string): ConfigData {
	const file = path.join(cfgPath, 'config.default.json');
	logger.debug(`Loading default config from ${file}`);
	return JSON.parse(fs.readFileSync(file).toString());
}

function loadCfgPlatform(cfgPath: string, platformId: string): ConfigData {
	let cfg: ConfigData;
	const file = path.join(cfgPath, platformId, 'config.json');
	if (fs.existsSync(file)) {
		cfg = JSON.parse(fs.readFileSync(file).toString());
	} else {
		cfg = {};
		logger.debug(`Config file for platform ${platformId} not found. Assuming defaults.`);
	}
	return cfg;
}

function loadCfgEnv(): ConfigData {
	return {
		queue: {
			defaults: {
				redis: {
					host: process.env.REDIS_HOST,
					port: parseInt(process.env.REDIS_PORT || '') || undefined,
				},
				redisRetryAttempts: parseInt(process.env.REDIS_RETRY_ATTEMPTS || '') || undefined,
			},
		},
	};
}

function loadConfig(cfgPath: string): ConfigData[] {
	const platformIds = loadPlatformIds(cfgPath);
	const cfgDefault = loadCfgDefault(cfgPath);

	const configuration = platformIds.map((pId) => {
		const cfgPlatform = loadCfgPlatform(cfgPath, pId);
		const cfgEnv = loadCfgEnv();

		let cfgCombined: ConfigData;

		// platform config overrides
		cfgCombined = defaults(cfgPlatform, cfgDefault);

		// env config overrides
		cfgCombined = defaults(cfgEnv, cfgCombined);

		// store platformId
		cfgCombined.platformId = pId;

		return cfgCombined;
	});

	return configuration;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConfigData = Record<string, any>;

export default loadConfig(path.join(__dirname, '..', 'platforms'));

// console.dir(configuration, { depth: null });
