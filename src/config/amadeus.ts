import Amadeus from 'amadeus';
import dotenv from 'dotenv';

dotenv.config();

// Log all environment variables (excluding secrets)
console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  // List all env vars except secrets
  envVarNames: Object.keys(process.env).filter(key => !key.toLowerCase().includes('secret'))
});

const apiKey = process.env.AMADEUS_API_KEY;
const apiSecret = process.env.AMADEUS_API_SECRET;

console.log('Amadeus Configuration:', {
  hasApiKey: !!apiKey,
  apiKeyLength: apiKey?.length || 0,
  apiKeyFirstChars: apiKey ? `${apiKey.substring(0, 4)}...` : 'none',
  hasApiSecret: !!apiSecret,
  apiSecretLength: apiSecret?.length || 0,
  apiSecretFirstChars: apiSecret ? `${apiSecret.substring(0, 4)}...` : 'none',
  nodeEnv: process.env.NODE_ENV
});

if (!apiKey || !apiSecret) {
  throw new Error('Amadeus API credentials not found in environment variables');
}

export const amadeus = new Amadeus({
  clientId: apiKey,
  clientSecret: apiSecret
}); 