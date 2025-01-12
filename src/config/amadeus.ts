import Amadeus from 'amadeus';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Use test credentials by default, unless explicitly in production
const apiKey = process.env.AMADEUS_API_KEY || 'r0crDqGd5OaacbQD0LRspXkSu2I4eWSE';
const apiSecret = process.env.AMADEUS_API_SECRET || 'Put1RlnJlOax8ojf';

console.log('Amadeus Configuration:', {
  environment: isProduction ? 'production' : 'test',
  hasApiKey: !!apiKey,
  apiKeyLength: apiKey?.length || 0,
  apiKeyFirstChars: apiKey ? `${apiKey.substring(0, 4)}...` : 'none',
  hasApiSecret: !!apiSecret,
  apiSecretLength: apiSecret?.length || 0,
  apiSecretFirstChars: apiSecret ? `${apiSecret.substring(0, 4)}...` : 'none',
  nodeEnv: process.env.NODE_ENV
});

export const amadeus = new Amadeus({
  clientId: apiKey,
  clientSecret: apiSecret,
  hostname: isProduction ? 'api.amadeus.com' : 'test.api.amadeus.com'
}); 