// standaloneUnifiModule.ts
import { AxiosInstance, AxiosResponse } from 'axios';
import { UnifiApiService } from '../interfaces/UnifiApiService';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import fetch from 'node-fetch';

// Global cookie storage like your working code
let cookie = '';
let csrf = '';

export const standaloneUnifiModule: UnifiApiService = {
  login: async (unifiApiClient: AxiosInstance): Promise<AxiosResponse> => {
    // Reset cookies
    cookie = '';
    csrf = '';

    // Use your working code's logic exactly
    const isUdmp = config.unifiControllerUrl?.includes(':8443');
    const endpoint = `${config.unifiControllerUrl}/api/${isUdmp ? 'auth/' : ''}login`;

    console.log('===== FETCH-BASED LOGIN (matching your working code) =====');
    console.log(`CONTROLLER URL: ${config.unifiControllerUrl}`);
    console.log(`IS UDMP (has :8443): ${isUdmp}`);
    console.log(`FULL ENDPOINT: ${endpoint}`);
    console.log(`USERNAME: ${config.unifiUsername ? '***SET***' : 'NOT SET'}`);
    console.log(`PASSWORD: ${config.unifiPassword ? '***SET***' : 'NOT SET'}`);
    console.log('==========================================================');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: config.unifiUsername,
        password: config.unifiPassword,
      }),
    });

    console.log(`LOGIN RESPONSE STATUS: ${res.status}`);

    if (res.status !== 200) {
      throw new Error(`UniFi login failed (${res.status})`);
    }

    // Extract cookies like your working code
    cookie = (res.headers.get('set-cookie') || '').split(';')[0];
    csrf = res.headers.get('x-csrf-token') || '';

    console.log(`EXTRACTED COOKIE: ${cookie ? '***SET***' : 'NOT SET'}`);
    console.log(`EXTRACTED CSRF: ${csrf ? '***SET***' : 'NOT SET'}`);

    // Return a mock AxiosResponse to satisfy the interface
    return {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      data: await res.json(),
      config: {} as any,
    } as AxiosResponse;
  },

  authorise: async (
    unifiApiClient: AxiosInstance,
    req: any,
  ): Promise<AxiosResponse> => {
    // Use your working code's authorization logic exactly
    const isUdmp = !config.unifiControllerUrl?.includes(':8443');
    const base = isUdmp
      ? `${config.unifiControllerUrl}/proxy/network`
      : config.unifiControllerUrl;
    const endpoint = `${base}/api/s/${config.unifiSiteIdentifier}/cmd/stamgr`;

    console.log(
      '===== FETCH-BASED AUTHORIZE (matching your working code) =====',
    );
    console.log(`BASE URL: ${base}`);
    console.log(`FULL ENDPOINT: ${endpoint}`);
    console.log(`MAC: ${req.session.macAddr}`);
    console.log(`USING COOKIE: ${cookie ? '***SET***' : 'NOT SET'}`);
    console.log(`USING CSRF: ${csrf ? '***SET***' : 'NOT SET'}`);
    console.log(
      '===============================================================',
    );

    const headers: any = {
      'Content-Type': 'application/json',
      Cookie: cookie,
    };

    if (csrf) {
      headers['X-Csrf-Token'] = csrf;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        cmd: 'authorize-guest',
        mac: req.session.macAddr,
        minutes: 120,
      }),
    });

    console.log(`AUTHORIZE RESPONSE STATUS: ${res.status}`);

    if (res.status === 401) {
      // Reset cookies and retry like your working code
      console.log('Got 401, clearing cookies for retry');
      cookie = '';
      csrf = '';
      throw new Error('401 - Authentication expired');
    }

    if (res.status !== 200) {
      throw new Error(`UniFi authorize failed (${res.status})`);
    }

    // Return a mock AxiosResponse to satisfy the interface
    return {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      data: await res.json(),
      config: {} as any,
    } as AxiosResponse;
  },

  logout: async (unifiApiClient: AxiosInstance): Promise<AxiosResponse> => {
    // Simple logout - just clear our cookies
    cookie = '';
    csrf = '';

    // Return a mock successful response
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {},
      config: {} as any,
    } as AxiosResponse;
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
