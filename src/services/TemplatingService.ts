import { messaging as firebaseMessaging } from 'firebase-admin';
import Mail from '@/interfaces/Mail';
import Template from '../interfaces/Template';
import TemplatePayload from '@/interfaces/TemplatePayload';
import UserRessource from '@/interfaces/UserRessource';
import Utils from '../utils';

const MAIL_MESSAGE = 'MAIL';
const PUSH_MESSAGE = 'PUSH';

export default class TemplatingService {
  // region public static methods
  // endregion

  // region private static methods

  private static insertMessagePayload(template: any, payload: any, platformId: string): any {
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
    // TODO: Access deviceId of User
    return Object.assign(template, {
      to: `${user.name} <${user.mail}>`,
      token: 'user.deviceToken',
    });
  }

  // endregion

  // region public members
  // endregion

  // region private members

  private readonly localizedTemplates: Template[] = [];

  // endregion

  // region constructor

  public constructor(platformId: string, templateId: string, payload: any) {
    this.generateTemplates(platformId, templateId, payload);
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

  public createPushMessage(user: UserRessource): firebaseMessaging.Message {
    const template = this.getTemplateForUser(user, PUSH_MESSAGE);
    const push = {
      token: template.token,
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

  private generateTemplates(platformId: string, templateId: string, payload: TemplatePayload[]) {
    for (const type of [MAIL_MESSAGE, PUSH_MESSAGE]) {
      // Step 1: Load base template
      let baseTemplate = Utils.getTemplate(platformId, templateId, type);

      // Step 2: Insert general payload into base template
      // TODO: Pass general message payload (with e.g. unique language identifier)
      baseTemplate = TemplatingService.insertMessagePayload(baseTemplate, {}, platformId);

      // Step 3: Insert language specific payload into base template for every language
      this.generateLanguagePayloads(payload, baseTemplate, type);
    }
  }

  private generateLanguagePayloads(payload: TemplatePayload[], baseTemplate: any, type: string): any {
    for (const languagePayload of payload) {
      const template = TemplatingService.insertLanguagePayload(baseTemplate, languagePayload.payload);
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
