import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import Template from '@/interfaces/Template';
import logger from './helper/logger';
import defaults from 'defaults-deep';
import Cache from '@/helper/cache';
import { QueueSettings } from 'bee-queue';
import { isNullOrUndefined } from 'util';

class Utils {


	private static _getPlatformConfig(platformId?: string): any {
		try {
			const config: {} = platformId ? require(`../platforms/${platformId}/config.json`) : {};
			const result = defaults(
				config,
				require(`../platforms/config.default.json`),
			);
			logger.info('platform config loaded', { platformId, result });
			return (result);
		} catch (err) {
			logger.error(
				'config.json missing. copy config.default.json to selected platform-folder "platforms/' + platformId + '" and update it.',
			);
			return (require(`../platforms/config.default.json`));
		}
	}

	private static _getPlatformIds(): string[] {
		const platformDir = path.join(__dirname, '..', 'platforms');
		const files = fs.readdirSync(platformDir);
		const platformIds = files.filter((file) => fs.lstatSync(path.join(platformDir, file)).isDirectory());
		logger.debug('platformIds loaded: ', { platformIds });
		return platformIds;
	}


	private static _loadTemplate(
		platformId: string,
		templateId: string,
		type: string,
		language?: string,
	): Promise<Template> {
		let template: Template;
		let templatePath = path.join(
			__dirname,
			'..',
			'platforms',
			platformId,
			'templates',
			templateId,
			`${type}${language ? '.' + language : ''}.mustache`,
		);
		try {
			template = yaml.safeLoad(fs.readFileSync(templatePath, 'utf8'));
		} catch (err) {
			// use language independent template as default/fallback
			templatePath = path.join(
				__dirname,
				'..',
				'platforms',
				platformId,
				'templates',
				templateId,
				`${type}.mustache`,
			);
			template = yaml.safeLoad(fs.readFileSync(templatePath, 'utf8'));
		}
		template.type = type;
		if (language) {
			template.language = language;
		}
		return Promise.resolve(template);
	}


	private cache: Cache;
	private platformIds: string[];
	private platformConfigs: any;

	constructor() {
		this.cache = new Cache(60);
		this.platformIds = Utils._getPlatformIds();
		this.platformConfigs = {};
	}

	public getPlatformConfig(platformId?: string): any {
		const platform = platformId || 'default';
		if (platform in this.platformConfigs) {
			return this.platformConfigs[platform];
		}
		const config = Utils._getPlatformConfig(platformId);
		this.platformConfigs[platform] = config;
		return config;
	}

	public getPlatformIds(): string[] {
		return this.platformIds;
	}

	public getRedisOptions(platformId?: string) {
		const platformConfig = this.getPlatformConfig(platformId);
		const options: QueueSettings = platformConfig.queue.defaults;
		if (!options.redis) { options.redis = {}; }
		options.redis.host = process.env.REDIS_HOST || '127.0.0.1';
		options.redis.port = parseInt(process.env.REDIS_PORT || '6379', undefined);
		options.redis.retry_strategy = (opts) => {
			if (opts.attempt >= parseInt(process.env.REDIS_RETRY_ATTEMPTS || '3', 10)) {
				logger.error('Unable to connect to the Redis server - Notification Service is going to exit!');
				process.exit(1);
			}
			return (opts.attempt + 1) * 1000;
		};
		logger.debug('redis config: ', options);
		return options;
	}

	public loadTemplate(
		platformId: string,
		templateId: string,
		type: string,
		language?: string,
	): Promise<Template> {
		const cacheKey = `${platformId}_${templateId}_${type}_${language ? language : 'nolanguage'}`;
		return this.cache.get(cacheKey, () => {
			return Utils._loadTemplate(platformId, templateId, type, language);
		});
	}

	public guid() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		}
		return (
			s4() +
			s4() +
			'-' +
			s4() +
			'-' +
			s4() +
			'-' +
			s4() +
			'-' +
			s4() +
			s4() +
			s4()
		);
	}

	public parametersMissing(parametersList: string[], base: any, res: any) {
		for (const parameter of parametersList) {
			if (!base.hasOwnProperty(parameter)) {
				res.status(400).send('Missing parameter: ' + parameter + '.');
				return true;
			}
		}
	}

	public serviceEnum() {
		return ['firebase', 'safari'];
	}

	public integerInRange(value: string, options: any) {
		const retValue = parseInt(value, 10);
		if (isNullOrUndefined(retValue)) { return options.default; }
		if (options.min && retValue < options.min) {
			throw new Error('Value min is ' + options.min);
		}
		if (options.max && retValue > options.max) {
			throw new Error('Value max is ' + options.max);
		}
		return retValue;
	}

	public async mustacheFunctions(
		platformId: string,
		messageId: string,
		receiverId: string,
	): Promise<any> {
		const config = await this.getPlatformConfig(platformId);
		return {
			callbackLink() {
				const url = config.callback.url;
				return (text: any, render: any) => {
					return url
						.replace('{RECEIVER_ID}', receiverId)
						.replace('{MESSAGE_ID}', messageId)
						.replace('{REDIRECT_URL}', render(text));
				};
			},
		};
	}
}

export default new Utils();
