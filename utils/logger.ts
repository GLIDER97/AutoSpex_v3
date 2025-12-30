/**
 * Logger utility for consistent logging across environments.
 * - Development: Logs everything.
 * - Production: Logs only errors and warnings, suppresses logs/info.
 */

const isProduction = import.meta.env.PROD;

export const logger = {
    log: (...args: any[]) => {
        if (!isProduction) {
            console.log(...args);
        }
    },
    info: (...args: any[]) => {
        if (!isProduction) {
            console.info(...args);
        }
    },
    warn: (...args: any[]) => {
        console.warn(...args);
    },
    error: (...args: any[]) => {
        console.error(...args);
    }
};
