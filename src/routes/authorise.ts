import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { webhook, googleSheets } from '../utils/logAuthDrivers';
import { config, UnifiControllerType } from '../utils/config';
import { createAxiosInstance } from '../utils/axios';

import { UnifiApiService } from '../interfaces/UnifiApiService';
import { standaloneUnifiModule, integratedUnifiModule } from '../unifi/index';

const authoriseRouter = express.Router();

const unifiAuthServices: Record<UnifiControllerType, UnifiApiService> = {
  standalone: standaloneUnifiModule,
  integrated: integratedUnifiModule,
};

const selectedModules = unifiAuthServices[config.unifiControllerType];

authoriseRouter.route('/').post(async (req: Request, res: Response) => {
  const maxRetries = 2;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const unifiApiClient = createAxiosInstance();
      logger.debug(
        `Starting Unifi Login Attempt (attempt ${attempt + 1}/${maxRetries})`,
      );
      await selectedModules.login(unifiApiClient);

      if (config.logAuthDriver) {
        await logAuth(req.body);
      }

      logger.debug('Starting Unifi Device Authorisation Attempt');
      await selectedModules.authorise(unifiApiClient, req);

      if (config.showConnecting === 'true') {
        logger.debug(`Redirecting to ${'./connecting'}`);
        res.redirect('./connecting');
      }

      if (
        config.showConnecting === 'false' &&
        config.serverSideRedirect === 'true'
      ) {
        // sleep 5s
        await new Promise((r) => setTimeout(r, 5000));
        logger.debug(`Redirecting to ${config.redirectUrl}`);
        res.redirect(config.redirectUrl);
      }

      logger.debug('Starting Unifi Logout Attempt');
      await selectedModules.logout(unifiApiClient);
      return; // Success, exit the retry loop
    } catch (err) {
      attempt++;
      logger.error(`Authorization attempt ${attempt} failed:`, err);

      // If it's a 401 and we have retries left, try again
      if (
        err instanceof Error &&
        err.message.includes('401') &&
        attempt < maxRetries
      ) {
        logger.debug('Got 401, retrying with fresh login...');
        continue;
      }

      // No more retries or different error
      res.status(500).json({
        err: {
          message: 'An Error has occurred. Please try again.',
        },
      });
      return;
    }
  }
});

export default authoriseRouter;

// Handle LogAuth
const logAuth = async (formData: any): Promise<void> => {
  switch (config.logAuthDriver) {
    case 'webhook':
      await webhook(formData);
      break;
    case 'googlesheets':
      await googleSheets(formData);
      break;
    default:
      break;
  }
};
