export default class Utils {
    public static getPlatformConfig(platformId: string): any {
        const config = require(`../platforms/${platformId}/config.json`);
        return config;
    }

    public static getTemplate(platformId: string, templateId: string, type: string): any {
        const config = require(`../platforms/${platformId}/templates/${templateId}/${type}.json`);
        return config;
    }
}