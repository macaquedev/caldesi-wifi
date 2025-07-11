/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { logger } from './logger';

const requiredEnvVars = [
  'UNIFI_USER',
  'UNIFI_PASS',
  'UNIFI_CONTROLLER_URL',
] as const;

export enum LogAuthDriver {
  None = 'none',
  Webhook = 'webhook',
  Googlesheets = 'googlesheets',
}

export enum UnifiControllerType {
  Standalone = 'standalone',
  Integrated = 'integrated',
}

export enum Auth {
  None = 'none',
  Simple = 'simple',
  UserInfo = 'userInfo',
  Custom = 'custom',
}

type Config = {
  unifiUsername: string;
  unifiPassword: string;
  unifiControllerUrl?: string;
  unifiControllerType: UnifiControllerType;
  unifiSiteIdentifier: string;
  sessionSecret: string;
  auth: Auth;
  redirectUrl: string;
  serverSideRedirect: string;
  showConnecting: string;
  logAuthDriver: LogAuthDriver;
  port?: string;
};

const config: Config = {
  unifiUsername: process.env.UNIFI_USER!,
  unifiPassword: process.env.UNIFI_PASS!,
  unifiControllerUrl: process.env.UNIFI_CONTROLLER_URL || process.env.URI,
  unifiControllerType:
    (process.env.UNIFI_CONTROLLER_TYPE as UnifiControllerType) ||
    UnifiControllerType.Standalone,
  unifiSiteIdentifier:
    process.env.UNIFI_SITE_IDENTIFIER || process.env.SITENAME || 'default',
  sessionSecret: process.env.SESSION_SECRET || 'secret',
  auth: (process.env.AUTH as Auth) || Auth.Simple,
  redirectUrl: process.env.REDIRECTURL || '/success.html',
  serverSideRedirect: process.env.SERVER_SIDE_REDIRECT || 'true',
  showConnecting: process.env.SHOW_CONNECTING || 'true',
  logAuthDriver:
    (process.env.LOG_AUTH_DRIVER as LogAuthDriver) || LogAuthDriver.None,
  port: process.env.PORT || '4545',
};

// Log the configuration (with sensitive data masked) for debugging
console.log('===== UNIFI CONFIGURATION =====');
console.log('UNIFI_USER:', config.unifiUsername ? '***SET***' : 'NOT SET');
console.log('UNIFI_PASS:', config.unifiPassword ? '***SET***' : 'NOT SET');
console.log('UNIFI_CONTROLLER_URL:', config.unifiControllerUrl);
console.log('UNIFI_CONTROLLER_TYPE:', config.unifiControllerType);
console.log('UNIFI_SITE_IDENTIFIER:', config.unifiSiteIdentifier);
console.log('AUTH:', config.auth);
console.log('==============================');

function checkForRequiredEnvVars(): void {
  // Check for required env vars
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      logger.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  });
  logger.debug('All required environment variables are present');
}

function validateConfig(): void {
  // Validate UnifiControllerType
  if (
    !Object.values(UnifiControllerType).includes(config.unifiControllerType)
  ) {
    logger.error(
      `Invalid value for UNIFI_CONTROLLER_TYPE. Expected one of: ${Object.values(UnifiControllerType).join(', ')}`,
    );
    process.exit(1);
  }

  // Validate LogAuthDriver
  if (!Object.values(LogAuthDriver).includes(config.logAuthDriver)) {
    logger.error(
      `Invalid value for LOG_AUTH_DRIVERS. Expected one of: ${Object.values(LogAuthDriver).join(', ')}`,
    );
    process.exit(1);
  }

  // Validate Auth
  if (!Object.values(Auth).includes(config.auth)) {
    logger.error(
      `Invalid value for AUTH. Expected one of: ${Object.values(Auth).join(', ')}`,
    );
    process.exit(1);
  }

  logger.debug('Configuration is valid');

  // If integrated ignore site identifier
}

function maskSensitiveConfig(config: Config): Partial<Config> {
  return {
    ...config,
    unifiPassword: '****',
  };
}

export { config, validateConfig, checkForRequiredEnvVars, maskSensitiveConfig };
