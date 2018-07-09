import { messaging as firebaseMessaging } from 'firebase-admin';
import Mustache from 'mustache';
import winston from 'winston';
import Mail from '@/interfaces/Mail';
import Template from '../interfaces/Template';
import LanguagePayload from '@/interfaces/LanguagePayload';
import UserRessource from '@/interfaces/UserRessource';
import Utils from '../utils';
import Payload from '@/interfaces/Payload';

const MAIL_MESSAGE = 'MAIL';
const PUSH_MESSAGE = 'PUSH';

export default class TemplatingService {
  // region public static methods
  // endregion

  // region private static methods
  private static initializeMessageTemplates(platformId: string, templateId: string): Template[] {
    return [MAIL_MESSAGE, PUSH_MESSAGE].map((type) => {
      const messageTemplate = Utils.loadTemplate(platformId, templateId, type);
      TemplatingService.parseMessageTemplate(messageTemplate);
      return messageTemplate;
    });
  }

  private static parseMessageTemplate(template: Template) {
    for (const key in template) {
      // && typeof template[key] === 'string'
      if (template.hasOwnProperty(key) && key !== 'type') {
        Mustache.parse(template[key]);
      }
    }
  }

  }

  private static initializeMessagePayloads(payload: any, languagePayloads: LanguagePayload[]): Payload[] {
    return languagePayloads.map((languagePayload: LanguagePayload): Payload => {
      return {
        message: payload,
        languageId: languagePayload.language,
        language: languagePayload.payload,
        user: {},
      };
      });
    }
  // endregion

  // region public members
  // endregion

  // region private members

  private parsedMessageTemplates: Template[];
  private messagePayloads: Payload[];

  // endregion

  // region constructor

  public constructor(platformId: string, templateId: string, payload: {}, languagePayloads: LanguagePayload[]) {
    this.parsedMessageTemplates = TemplatingService.initializeMessageTemplates(platformId, templateId);
    this.messagePayloads = TemplatingService.initializeMessagePayloads(payload, languagePayloads);
  }

  // endregion

  // region public methods

  public createMailMessage(user: UserRessource): Mail {
    const template = this.getTemplateForUser(user, MAIL_MESSAGE);
    const mail = {
      from: template.from,
      to: user.mail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };
    return mail;
  }

  public createPushMessage(user: UserRessource, device: string): firebaseMessaging.Message {
    const template = this.getTemplateForUser(user, PUSH_MESSAGE);
    const push = {
      token: device,
      data: template.data,
      notification: template.notification,
      android: template.android,
      webpush: template.webpush,
      apns: template.apns,
    };
    return push;
  }

  // endregion

  // region private methods

  private compileMessageTemplates(platformId: string, templateId: string, payload: {}) {
    const messageTemplates = [];

    for (const type of [MAIL_MESSAGE, PUSH_MESSAGE]) {
      // Step 1: Load base template
      const baseTemplate = Utils.getTemplate(platformId, templateId, type);
      console.log(baseTemplate);

      // Step 2: Insert general payload into base template
      const messageTemplate = TemplatingService.insertMessagePayload(baseTemplate, payload, platformId);
      messageTemplates.push(messageTemplate);
    }

    return messageTemplates;
  }

  private compileLanguageTemplates(type: string, messageTemplate: any, payload: LanguagePayload[]): any {
    for (const languagePayload of payload) {
      const template = TemplatingService.insertLanguagePayload(messageTemplate, languagePayload.payload);
      const languageId = languagePayload.language;
      const localizedTemplate = {
        languageId,
        type,
        template,
      };
      this.localizedTemplates.push(localizedTemplate);
    }
  }

  private getTemplate(languageId: string, type: string): any {
    const currentTemplate: Template | undefined = this.localizedTemplates.find(
      (template: Template) => {
        return (template.languageId === languageId) && (template.type === type);
      },
    );

    if (currentTemplate) {
      return currentTemplate.template;
    } else {
      return new Error('Invalid languageId or type. Template not found.');
    }
  }

  private getTemplateForUser(user: UserRessource, type: string): any {
    let template = this.getTemplate(user.language, type);
    template = TemplatingService.insertUserPayload(template, user);
    return template;
  }

  // endregion
}
