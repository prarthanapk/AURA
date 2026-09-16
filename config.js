/**
 * AURA — Frontend Environment & API Configuration
 *
 * Automatically manages API endpoint routing between local development and production:
 * - Local Development: http://localhost:3000
 * - Production (Render): https://aura-6o4w.onrender.com
 *
 * Supports optional runtime override via query param (?env=production or ?env=local)
 */

(function () {
  'use strict';

  const ENV_CONFIG = {
    development: {
      apiBaseUrl: 'http://localhost:3000'
    },
    production: {
      apiBaseUrl: 'https://aura-6o4w.onrender.com'
    }
  };

  // Determine whether running locally or on a remote host
  const isLocalHost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '' ||
    window.location.protocol === 'file:'
  );

  // Allow manual query parameter override for testing (e.g., ?env=production or ?api=local)
  const urlParams = new URLSearchParams(window.location.search);
  const forcedEnv = (urlParams.get('env') || urlParams.get('api') || '').toLowerCase();

  let activeApiBaseUrl;
  let activeEnv;

  if (forcedEnv === 'production' || forcedEnv === 'prod') {
    activeApiBaseUrl = ENV_CONFIG.production.apiBaseUrl;
    activeEnv = 'production';
  } else if (forcedEnv === 'development' || forcedEnv === 'local' || forcedEnv === 'dev') {
    activeApiBaseUrl = ENV_CONFIG.development.apiBaseUrl;
    activeEnv = 'development';
  } else {
    activeApiBaseUrl = isLocalHost
      ? ENV_CONFIG.development.apiBaseUrl
      : ENV_CONFIG.production.apiBaseUrl;
    activeEnv = isLocalHost ? 'development' : 'production';
  }

  // Expose configuration globally
  window.AURA_CONFIG = {
    environment: activeEnv,
    isLocal: isLocalHost,
    apiBaseUrl: activeApiBaseUrl,
    endpoints: {
      submitGrievance: `${activeApiBaseUrl}/api/submit-grievance`,
      sendGuidance: `${activeApiBaseUrl}/api/send-guidance`,
      health: `${activeApiBaseUrl}/api/health`
    }
  };

  // Convenience alias
  window.AURA_API_BASE_URL = activeApiBaseUrl;

  console.groupCollapsed(
    `%c🛡️ [AURA API CONFIG] Active: ${activeEnv.toUpperCase()} (${activeApiBaseUrl})`,
    'color: #C44747; font-weight: bold; font-size: 11px;'
  );
  console.log('Environment:', activeEnv);
  console.log('API Base URL:', activeApiBaseUrl);
  console.log('Endpoints:', window.AURA_CONFIG.endpoints);
  console.groupEnd();
})();
