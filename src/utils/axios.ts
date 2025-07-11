import axios from 'axios';
import { HttpCookieAgent, HttpsCookieAgent } from 'http-cookie-agent/http';
import { CookieJar } from 'tough-cookie';
import { logger } from './logger';
import { config } from './config';

export const createAxiosInstance = () => {
  const jar = new CookieJar();

  const instance = axios.create({
    baseURL: config.unifiControllerUrl,
    httpAgent: new HttpCookieAgent({ cookies: { jar } }),
    httpsAgent: new HttpsCookieAgent({
      cookies: { jar },
      rejectUnauthorized: false,
    }),
    timeout: 10000,
  });

  // Request interceptor
  instance.interceptors.request.use(
    (request) => {
      console.log('===== AXIOS REQUEST =====');
      console.log(`METHOD: ${request.method?.toUpperCase()}`);
      console.log(`FULL URL: ${request.baseURL}${request.url}`);
      console.log(`BASE URL: ${request.baseURL}`);
      console.log(`ENDPOINT: ${request.url}`);
      console.log(`HEADERS:`, JSON.stringify(request.headers, null, 2));
      console.log(`TIMEOUT: ${request.timeout}ms`);
      if (request.data) {
        console.log(`REQUEST BODY:`, JSON.stringify(request.data, null, 2));
      }
      console.log('========================');

      logger.debug(
        `Starting Request: ${request.method?.toUpperCase()} ${request.baseURL}${request.url}`,
      );
      logger.debug(`Request Headers: ${JSON.stringify(request.headers)}`);
      if (request.data) {
        logger.debug(`Request Data: ${JSON.stringify(request.data)}`);
      }
      return request;
    },
    (error) => {
      console.log('===== AXIOS REQUEST ERROR =====');
      console.log('ERROR:', error.message);
      console.log('===============================');
      logger.error(`Request Error: ${error.message}`);
      return Promise.reject(error);
    },
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      console.log('===== AXIOS RESPONSE =====');
      console.log(`STATUS: ${response.status} ${response.statusText}`);
      console.log(`URL: ${response.config.url}`);
      console.log(
        `RESPONSE HEADERS:`,
        JSON.stringify(response.headers, null, 2),
      );
      console.log(`RESPONSE DATA:`, JSON.stringify(response.data, null, 2));
      console.log('==========================');

      logger.info(
        `Response from ${response.config.url}: ${response.status} ${response.statusText}`,
      );
      logger.debug(`Response Headers: ${JSON.stringify(response.headers)}`);
      logger.debug(`Response Data: ${JSON.stringify(response.data)}`);

      // Handle CSRF token for subsequent requests
      const csrfToken = response.headers['x-csrf-token'];
      if (csrfToken) {
        console.log(`SETTING CSRF TOKEN: ${csrfToken}`);
        instance.defaults.headers.common['x-csrf-token'] = csrfToken;
        logger.debug('CSRF token updated for future requests');
      }

      return response;
    },
    (error) => {
      console.log('===== AXIOS RESPONSE ERROR =====');
      if (error.response) {
        console.log(
          `ERROR STATUS: ${error.response.status} ${error.response.statusText}`,
        );
        console.log(`ERROR URL: ${error.response.config.url}`);
        console.log(
          `ERROR HEADERS:`,
          JSON.stringify(error.response.headers, null, 2),
        );
        console.log(
          `ERROR DATA:`,
          JSON.stringify(error.response.data, null, 2),
        );
      } else if (error.request) {
        console.log('NO RESPONSE RECEIVED');
        console.log('REQUEST:', error.request);
      } else {
        console.log('ERROR SETTING UP REQUEST:', error.message);
      }
      console.log('================================');

      if (error.response) {
        logger.error(
          `Server responded with an error from ${error.response.config.url}: ${error.response.status} ${error.response.statusText}`,
        );
        logger.error(`Error Data: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        logger.error(`No response received: ${error.request}`);
      } else {
        logger.error(`Error: ${error.message}`);
      }
      return Promise.reject(error);
    },
  );

  return instance;
};
