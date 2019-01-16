import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import Template from '@/interfaces/Template';
import winston from 'winston';


export default class Utils {


  public static getPlatformConfig(platformId: string): any {
    let config = {};
    try {
      config = require(`../platforms/${platformId}/config.json`)
    } catch (err) {
      winston.error('config.json missing. copy config.default.json to selected platform folder and rename.');
      config = require(`../platforms/config.default.json`);
    }
    return config;
  }

  public static loadTemplate(platformId: string, templateId: string, type: string): Template {
    const templatePath =
      path.join(__dirname, '..', 'platforms', platformId, 'templates', templateId, `${type}.mustache`);
    const template = yaml.safeLoad(fs.readFileSync(templatePath, 'utf8'));
    template.type = type;
    return template;
  }

  public static mustacheFunctions(platformId: string, messageId: string): any {
    const config = Utils.getPlatformConfig(platformId);
    return {
      callbackLink: function () {
        let url = config.callback.url;
        return function (text: any, render: any) {
          return url.replace('{MESSAGE_ID}', messageId).replace('{REDIRECT_URL}', render(text));
        };
      }
    }
  }
}
