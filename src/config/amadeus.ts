import Amadeus from 'amadeus';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.AMADEUS_API_KEY || '5v4qAUOvNrAE0DKEvHFi9On5KM4c5mD1';
const apiSecret = process.env.AMADEUS_API_SECRET || 'mvoeMRpVhsIAxseJ';

console.log('Amadeus Configuration:', {
  hasApiKey: !!apiKey,
  apiKeyLength: apiKey.length,
  hasApiSecret: !!apiSecret,
  apiSecretLength: apiSecret.length,
  nodeEnv: process.env.NODE_ENV
});

if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
  console.warn('Warning: Amadeus API credentials not found in environment variables');
}

export const amadeus = new Amadeus({
  clientId: apiKey,
  clientSecret: apiSecret
}); 