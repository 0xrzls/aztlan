// src/utils/aztecLogger.ts
export class AztecLogger {
  private static logLevel = process.env.REACT_APP_LOG_LEVEL || 'info';

  static error(message: string, error?: any) {
    console.error(`[Aztec Error] ${message}`, error);
    // Optional: Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // this.sendToMonitoring('error', message, error);
    }
  }

  static warn(message: string, data?: any) {
    if (this.logLevel === 'debug' || this.logLevel === 'warn') {
      console.warn(`[Aztec Warning] ${message}`, data);
    }
  }

  static info(message: string, data?: any) {
    if (this.logLevel === 'debug' || this.logLevel === 'info') {
      console.info(`[Aztec Info] ${message}`, data);
    }
  }

  static debug(message: string, data?: any) {
    if (this.logLevel === 'debug') {
      console.debug(`[Aztec Debug] ${message}`, data);
    }
  }
}
