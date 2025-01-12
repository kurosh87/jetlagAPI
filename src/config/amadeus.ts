import Amadeus from 'amadeus';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

// Always use test environment for now
const apiKey = 'r0crDqGd5OaacbQD0LRspXkSu2I4eWSE';
const apiSecret = 'Put1RlnJlOax8ojf';

console.log('Amadeus Configuration:', {
  environment: 'test',
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
  hostname: 'test.api.amadeus.com',
  customAgent: httpsAgent
}); 