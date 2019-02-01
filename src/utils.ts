import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import Template from '@/interfaces/Template';

export default class Utils {
  public static getPlatformConfig(platformId: string): any {
    return require(`../platforms/${platformId}/config.json`);
  }

  public static loadTemplate(platformId: string, templateId: string, type: string): Template {
    const templatePath =
      path.join(__dirname, '..', 'platforms', platformId, 'templates', templateId, `${type}.mustache`);
    const template = yaml.safeLoad(fs.readFileSync(templatePath, 'utf8'));
    template.type = type;
    return template;
  }
  
  public static guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }
}
