// standaloneUnifiModule.ts
import { AxiosInstance, AxiosResponse } from 'axios';
import { UnifiApiService } from '../interfaces/UnifiApiService';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export const standaloneUnifiModule: UnifiApiService = {
  login: async (unifiApiClient: AxiosInstance): Promise<AxiosResponse> => {
    // Detect if this is a UDMP (port 8443) or regular controller
    const isUdmp = config.unifiControllerUrl?.includes(':8443');
    const loginEndpoint = `/api/${isUdmp ? 'auth/' : ''}login`;

    console.log('===== UNIFI LOGIN CONFIGURATION =====');
    console.log(`CONTROLLER URL: ${config.unifiControllerUrl}`);
    console.log(`IS UDMP (has :8443): ${isUdmp}`);
    console.log(`LOGIN ENDPOINT: ${loginEndpoint}`);
    console.log(`USERNAME: ${config.unifiUsername ? '***SET***' : 'NOT SET'}`);
    console.log(`PASSWORD: ${config.unifiPassword ? '***SET***' : 'NOT SET'}`);
    console.log('=====================================');

    const loginResponse = await unifiApiClient.post(loginEndpoint, {
      username: config.unifiUsername,
      password: config.unifiPassword,
    });

    if (loginResponse.status === 200) {
      console.log('✅ UNIFI LOGIN SUCCESSFUL');
      logger.debug('Unifi Login Successful');
      return loginResponse;
    } else {
      console.log(`❌ UNIFI LOGIN FAILED - Status: ${loginResponse.status}`);
      throw new Error('Unifi Login Failed: Incorrect Response');
    }
  },
  authorise: async (
    unifiApiClient: AxiosInstance,
    req: any,
  ): Promise<AxiosResponse> => {
    // Detect if this is a UDMP (not port 8443) or regular controller
    const isUdmp = !config.unifiControllerUrl?.includes(':8443');
    const baseUrl = isUdmp ? '/proxy/network' : '';

    const authorizeResponse = await unifiApiClient.post(
      `${baseUrl}/api/s/${config.unifiSiteIdentifier}/cmd/stamgr`,
      {
        cmd: 'authorize-guest',
        mac: req.session.macAddr,
        ap_mac: req.session.accessPoint,
        minutes: 120, // Default session time
      },
    );

    if (authorizeResponse.status === 200) {
      logger.debug('Unifi Device Authorisation Successful');
      return authorizeResponse;
    } else {
      throw new Error('Unifi Device Authorisation Failed: Incorrect Response');
    }
  },
  logout: async (unifiApiClient: AxiosInstance): Promise<AxiosResponse> => {
    const logoutResponse = await unifiApiClient.post('/api/logout');
    return logoutResponse;
  },
};

export const integratedUnifiModule: UnifiApiService = {
  login: async (unifiApiClient: AxiosInstance): Promise<AxiosResponse> => {
    const loginResponse = await unifiApiClient.post('/api/auth/login', {
      username: config.unifiUsername,
      password: config.unifiPassword,
    });
    unifiApiClient.defaults.headers.common['x-csrf-token'] =
      loginResponse.headers['x-csrf-token'];
    if (loginResponse.status === 200) {
      unifiApiClient.defaults.headers.common['x-csrf-token'] =
        loginResponse.headers['x-csrf-token'];
      return loginResponse;
    } else {
      throw new Error(
        'Unifi Login Failed: Incorrect Response from Unifi Controller',
      );
    }
  },
  authorise: async (
    unifiApiClient: AxiosInstance,
    req: any,
  ): Promise<AxiosResponse> => {
    const authorizeResponse = await unifiApiClient.post(
      `/proxy/network/api/s/${config.unifiSiteIdentifier}/cmd/stamgr`,
      JSON.stringify({
        cmd: 'authorize-guest',
        mac: req.session.macAddr,
        ap_mac: req.session.accessPoint,
      }),
    );
    return authorizeResponse;
  },
  logout: async (unifiApiClient: AxiosInstance): Promise<AxiosResponse> => {
    const logoutResponse = await unifiApiClient.post('/api/auth/logout');
    return logoutResponse;
  },
};
