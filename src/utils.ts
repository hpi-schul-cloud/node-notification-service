export default class Utils {
    public static getPlatformConfig(platformId: string): any {
        const config = require(`../platforms/${platformId}/config.json`);
        return config;
    }
}