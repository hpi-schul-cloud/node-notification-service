import { messaging as firebaseMessaging } from 'firebase-admin';
import Mail from '@/interfaces/Mail';
import Template from '../interfaces/Template';
import LanguagePayload from '@/interfaces/LanguagePayload';
import UserRessource from '@/interfaces/UserRessource';
import Utils from '../utils';

const MAIL_MESSAGE = 'MAIL';
const PUSH_MESSAGE = 'PUSH';

export default class TemplatingService {
  // region public static methods
  // endregion

  // region private static methods

  private static insertMessagePayload(template: any, payload: any, platformId: string): any {
    // TODO: Use Mustache here.
    const config = Utils.getPlatformConfig(platformId);
    return {
      from: config.mail.defaults.from,
      data: template.data,
    };
  }

  private static insertLanguagePayload(template: any, payload: any): any {
    // TODO: Insert message content into template
    return Object.assign(template, {
      subject: payload.title,
      text: payload.body,
      html: payload.body,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      android: template.android,
      webpush: template.webpush,
      apns: {
        payload: {
          aps: {
            title: payload.title,
            body: payload.body,
          },
        },
      },
    });
  }

  private static insertUserPayload(template: any, user: UserRessource): any {
    return Object.assign(template, {
      to: `${user.name} <${user.mail}>`,
    });
  }

  // endregion

  // region public members
  // endregion

  // region private members

  private readonly localizedTemplates: Template[] = [];

  // endregion

  // region constructor

  public constructor(platformId: string, templateId: string, payload: {}, languagePayloads: LanguagePayload[]) {
    const messageTemplates = this.compileMessageTemplates(platformId, templateId, payload);
    for (const messageTemplate of messageTemplates) {
      this.compileLanguageTemplates('MAIL', messageTemplate, languagePayloads);
    }
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
