import yaml from 'js-yaml';
import fs from 'fs';

export default class Utils {
    public static getPlatformConfig(platformId: string): any {
        return require(`../platforms/${platformId}/config.json`);
    }

    public static getTemplate(platformId: string, templateId: string, type: string): any {
        return yaml.safeLoad(fs.readFileSync(`../platforms/${platformId}/templates/${templateId}/${type}.mustache`, 'utf8'));
    }
}
