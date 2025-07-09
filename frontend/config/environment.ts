interface Environment {
  backendUrl: string;
  apiUrl: string;
  authUrl: string;
  fileUploadUrl: string;
  env: 'development' | 'production';
  log: {
    enabled: boolean;
    storeErrors: boolean;
  };
  sms: {
    apiUrl: string;
    sendUrl: string;
  };
  googleAnalytics: {
    trackingId: string;
  };
  version: {
    number: string;
    date: string;
  };
  support: {
    email: string;
  };
  appSettings: {
    logo: string;
    appName: string;
    companyName: string;
  };
}

const environment: Environment = {
  backendUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:4132',
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:4132/api',
  authUrl: process.env.REACT_APP_AUTH_URL || 'http://localhost:4132/token',
  fileUploadUrl: process.env.REACT_APP_FILE_UPLOAD_URL || 'http://localhost:4132/api/File',
  env: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production')
  ? process.env.NODE_ENV
  : 'development',
  log: {
    enabled: true,
    storeErrors: true,
  },
  sms: {
    apiUrl: 'http://localhost:4132/api/Identification',
    sendUrl: 'http://localhost:4132/api/Identification/GenerateOtpBeeline',
  },
  googleAnalytics: {
    trackingId: process.env.REACT_APP_GA_TRACKING_ID || 'UA-XXXXX-Y',
  },
  version: {
    number: '1.0.0',
    date: new Date().toISOString().split('T')[0],
  },
  support: {
    email: 'support@example.com',
  },
  appSettings: {
    logo: '/assets/images/logo.svg',
    appName: 'Карты ПГНИУ',
    companyName: 'ООО "Карты ПГНИУ"',
  },
};

export default environment;