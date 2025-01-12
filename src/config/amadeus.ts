import Amadeus from 'amadeus';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

// Use production credentials
const apiKey = '5v4qAUOvNrAE0DKEvHFi9On5KM4c5mD1';
const apiSecret = 'mvoeMRpVhsIAxseJ';

console.log('Amadeus Configuration:', {
  environment: 'production',
  hasApiKey: !!apiKey,
  apiKeyLength: apiKey?.length || 0,
  apiKeyFirstChars: apiKey ? `${apiKey.substring(0, 4)}...` : 'none',
  hasApiSecret: !!apiSecret,
  apiSecretLength: apiSecret?.length || 0,
  apiSecretFirstChars: apiSecret ? `${apiSecret.substring(0, 4)}...` : 'none'
});

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true
});

export const amadeus = new Amadeus({
  clientId: apiKey,
  clientSecret: apiSecret,
  hostname: 'api.amadeus.com',
  customAgent: httpsAgent
}); 