import fs from 'fs';
import path from 'path';
import { defaultsDeep } from 'lodash';
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

function applyMailEnv(cfg: ConfigData): ConfigData {
	const cfgEnv = {
		host: process.env.MAIL_HOST,
		port: parseInt(process.env.MAIL_PORT || '') || undefined,
	};

	const mailOptions = Array.isArray(cfg.mail.options)
		? (cfg.mail.options as ConfigData[])
		: ([cfg.mail.options] as ConfigData[]);

	cfg.mail.options = mailOptions.map((cfgOpt) => {
		return defaultsDeep(cfgEnv, cfgOpt);
	});

	return cfg;
}

function loadConfig(cfgPath: string): ConfigData[] {
	const platformIds = loadPlatformIds(cfgPath);
	const cfgDefault = loadCfgDefault(cfgPath);

	const configuration = platformIds.map((pId) => {
		const cfgPlatform = loadCfgPlatform(cfgPath, pId);
		const cfgEnv = loadCfgEnv();

		let cfgCombined: ConfigData;

		// platform config overrides
		cfgCombined = defaultsDeep(cfgPlatform, cfgDefault);

		// general env config overrides
		cfgCombined = defaultsDeep(cfgEnv, cfgCombined);

		// mail env config overrides
		cfgCombined = applyMailEnv(cfgCombined);

		// store platformId
		cfgCombined.platformId = pId;

		return cfgCombined;
	});

	logger.debug('Application config loaded:', configuration);

	return configuration;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConfigData = Record<string, any>;

export default loadConfig(path.join(__dirname, '..', 'platforms'));
