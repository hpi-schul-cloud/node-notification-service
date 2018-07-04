export default class Utils {
    public static getPlatformConfig(platformId: string): any {
        return require(`../platforms/${platformId}/config.json`);
    }

    public static getTemplate(platformId: string, templateId: string, type: string): any {
        return require(`../platforms/${platformId}/templates/${templateId}/${type}.json`);
    }
}
