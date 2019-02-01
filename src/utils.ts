import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import Template from '@/interfaces/Template';
import winston from 'winston';


export default class Utils {


  public static getPlatformConfig(platformId: string): any {
    let config = {};
    try {
      config = require(`../platforms/${platformId}/config.json`);
    } catch (err) {
      winston.error('config.json missing. copy config.default.json to selected platform folder and rename. use default fallback instead...');
      config = require(`../platforms/config.default.json`);
    }
    return config;
  }

  public static loadTemplate(platformId: string, templateId: string, type: string, language?: string): Template {
    let template: Template;
    let templatePath = path.join(__dirname, '..', 'platforms', platformId, 'templates', templateId, `${type}${language ? '.' + language : ''}.mustache`);
    try {
      template = yaml.safeLoad(fs.readFileSync(templatePath, 'utf8'));
    } catch (err) {
      // use language independent template as default/fallback
      templatePath = path.join(__dirname, '..', 'platforms', platformId, 'templates', templateId, `${type}.mustache`);
      template = yaml.safeLoad(fs.readFileSync(templatePath, 'utf8'));
    }
    template.type = type;
    if (language) {
      template.language = language;
    }
    return template;
  }

  public static mustacheFunctions(platformId: string, messageId: string, receiverId: string): any {
    const config = Utils.getPlatformConfig(platformId);
    return {
      callbackLink() {
        const url = config.callback.url;
        return function(text: any, render: any) {
          return url.replace('{RECEIVER_ID}', receiverId).replace('{MESSAGE_ID}', messageId).replace('{REDIRECT_URL}', render(text));
        };
      },
    };
  }
}
