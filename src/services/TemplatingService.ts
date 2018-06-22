import { messaging as firebaseMessaging } from 'firebase-admin';
import Mail from '@/interfaces/Mail';
import Template, { MessageTypes } from '@/interfaces/Template';
import UserRessource from '@/interfaces/UserRessource';
import Utils from '@/utils';

export default class TemplatingService {
  // region public static methods
  // endregion
  
  // region private static methods

  private static insertMessagePayload(template: any, payload: any): any {
    throw new Error("Method not implemented.");
  }

  private static insertContent(template: any, content: any): any {
    throw new Error("Method not implemented.");
  }

  private static insertUserPayload(template: any, payload: any): any {
    throw new Error("Method not implemented.");
  }

  // endregion
  
  // region public members
  // endregion
  
  // region private members

  private readonly _localizedTemplates: Template[] = [];

  // endregion
  
  // region constructor

  public constructor(platformId: string, templateId: string, payload: any, content: any) {
    this.generateTemplates(platformId, templateId, payload, content);
  }

  // endregion
  
  // region public methods

  public createMailMessage(user: UserRessource): Mail {
    const template = this.getTemplateForUser(user, MessageTypes.Mail);
    const mail = {
      from: template.from,
      to: user.mail,
      subject: template.subject,
      text: template.text,
      html: template.html
    }
    return mail;
  }

  public createPushMessage(user: UserRessource): firebaseMessaging.Message {
    const template = this.getTemplateForUser(user, MessageTypes.Push);
    const push = {
      token: 'user.deviceId',
      data: template.data,
      notification: template.notification,
      android: template.android,
      webpush: template.webpush,
      apns: template.apns
    }
    return push;
  }

  // endregion
  
  // region private methods

  private generateTemplates(platformId: string, templateId: string, payload: any, content: any) {
    for (const type in MessageTypes) {
      // Step 1: Load base template
      let baseTemplate = Utils.getTemplate(platformId, templateId, type);
      
      // Step 2: Insert payload into base template
      baseTemplate = TemplatingService.insertMessagePayload(baseTemplate, payload);

      // Step 3: Insert content into base template for every language
      for (const languageId in content) {
        const template = TemplatingService.insertContent(baseTemplate, content[languageId]);
        const localizedTemplate = {
          languageId,
          type,
          template
        };
        this._localizedTemplates.push(localizedTemplate);
      }
    }
  }

  private getTemplate(languageId: string, type: string): any {
    const currentTemplate: Template | undefined = this._localizedTemplates.find(
      (template: Template) => {
        return (template.languageId === languageId) && (template.type === type);
      }
    );

    if (currentTemplate) {
      return currentTemplate.template;
    } else {
      console.log('Invalid languageId or type. Template not found.');
      return '';
    }
  }

  private getTemplateForUser(user: UserRessource, type: string): any {
    let template = this.getTemplate(user.languageId, type);
    template = TemplatingService.insertUserPayload(template, user.payload);
    return template;
  }

  // endregion
}
