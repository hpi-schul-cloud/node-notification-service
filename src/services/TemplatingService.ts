import logger from '@/helper/logger';
import LanguagePayload from '@/interfaces/LanguagePayload';
import Mail from '@/interfaces/Mail';
import Payload from '@/interfaces/Payload';
import Template from '@/interfaces/Template';
import UserResource from '@/interfaces/UserResource';
import Utils from '@/utils';
import { messaging as firebaseMessaging } from 'firebase-admin';
import Mustache from 'mustache';

const MAIL_MESSAGE = 'MAIL';
const PUSH_MESSAGE = 'PUSH';

export default class TemplatingService {
	public static async create(
		platformId: string,
		templateId: string,
		// eslint-disable-next-line @typescript-eslint/ban-types
		payload: {},
		languagePayloads: LanguagePayload[],
		messageId: string,
		language?: string
	): Promise<TemplatingService> {
		const templatingService = new TemplatingService(platformId, messageId);
		templatingService.parsedMessageTemplates = await TemplatingService.initializeMessageTemplates(
			platformId,
			templateId,
			language
		);
		templatingService.messagePayloads = TemplatingService.initializeMessagePayloads(payload, languagePayloads);
		return templatingService;
	}
	// region public static methods
	// endregion

	// region private static methods
	private static async initializeMessageTemplates(
		platformId: string,
		templateId: string,
		language?: string
	): Promise<Template[]> {
		// FIXME fetch all languages and initialize only once
		const templates = [MAIL_MESSAGE, PUSH_MESSAGE].map(async (type) => {
			const messageTemplate = await Utils.loadTemplate(platformId, templateId, type, language);
			TemplatingService.parseMessageTemplate(messageTemplate);
			return messageTemplate;
		});
		return Promise.all(templates);
	}

	private static parseMessageTemplate(template: Template) {
		for (const key in template) {
			if (template.hasOwnProperty(key)) {
				const value = template[key];

				if (typeof value === 'object') {
					this.parseMessageTemplate(value);
				} else if (typeof value === 'string') {
					Mustache.parse(value);
				}
			}
		}
	}

	private static initializeMessagePayloads(payload: any, languagePayloads: LanguagePayload[]): Payload[] {
		return languagePayloads.map(
			(languagePayload: LanguagePayload): Payload => {
				return {
					_id: Utils.guid(),
					message: payload,
					languageId: languagePayload.language,
					language: languagePayload.payload,
					user: {},
				};
			}
		);
	}
	// endregion

	// region public members
	public platform: string;
	public messageId: string;

	// region public methods
	// endregion

	// region private members

	private parsedMessageTemplates: Template[];
	private messagePayloads: Payload[];

	// endregion

	// region constructor

	private constructor(platformId: string, messageId: string) {
		this.platform = platformId;
		this.messageId = messageId;
		this.parsedMessageTemplates = [];
		this.messagePayloads = [];
	}

	public async createMailMessage(user: UserResource): Promise<Mail> {
		const template = this.getTemplate(MAIL_MESSAGE);
		const payload = this.getUserPayload(user);
		const functions = await this.getMustacheFunctions(user);
		const renderedTemplate = this.renderMessageTemplate(template, payload, functions);

		const mail = {
			from: renderedTemplate.from,
			to: user.mail,
			subject: renderedTemplate.subject,
			text: renderedTemplate.text,
			html: renderedTemplate.html,
		};
		return mail;
	}

	public async createPushMessage(user: UserResource, device: string): Promise<firebaseMessaging.Message> {
		const template = this.getTemplate(PUSH_MESSAGE);
		const payload = this.getUserPayload(user);
		const functions = await this.getMustacheFunctions(user);
		const renderedTemplate = this.renderMessageTemplate(template, payload, functions);
		const push = {
			token: device,
			data: renderedTemplate.data,
			notification: renderedTemplate.notification,
			android: renderedTemplate.android,
			webpush: renderedTemplate.webpush,
			apns: renderedTemplate.apns,
		};
		return push;
	}

	public createSafariPushMessage(user: UserResource, device: string): Promise<any> {
		// FIXME create safari push message type for send interface
		throw Error('safari push currently not supported');
	}
	public async getMustacheFunctions(user: any): Promise<any> {
		return await Utils.mustacheFunctions(this.platform, this.messageId, user.userId);
	}
	// endregion

	// region private methods

	private renderMessageTemplate(template: Template, payload: Payload, functions?: any): any {
		const enrichedPayload = Object.assign({}, payload, functions ? functions : {});
		const compiledTemplate = Object.assign({}, template);
		for (const key in compiledTemplate) {
			if (compiledTemplate.hasOwnProperty(key)) {
				const value = compiledTemplate[key];

				if (typeof value === 'object') {
					compiledTemplate[key] = this.renderMessageTemplate(value, enrichedPayload);
				} else if (typeof value === 'string') {
					compiledTemplate[key] = Mustache.render(value, enrichedPayload);
				}
			}
		}
		return compiledTemplate;
	}

	private getTemplate(type: string): Template {
		const parsedMessageTemplate = this.parsedMessageTemplates.find((template) => {
			return template.type === type;
		});

		if (!parsedMessageTemplate) {
			const errorMessage = `Could not find message template for type ${type}`;
			logger.error(errorMessage);
			throw new Error(errorMessage);
		}

		return parsedMessageTemplate;
	}

	private getUserPayload(user: UserResource): Payload {
		const messagePayload = this.messagePayloads.find((payload) => payload.languageId === user.language);

		if (!messagePayload) {
			const errorMessage = `Could not find message payload for language ${user.language}`;
			logger.error(errorMessage);
			throw new Error(errorMessage);
		}

		messagePayload.user = user.payload;
		return messagePayload;
	}
	// endregion
}
