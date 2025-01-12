import Amadeus from 'amadeus';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
  console.warn('Warning: Amadeus API credentials not found in environment variables');
}

export const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY || '5v4qAUOvNrAE0DKEvHFi9On5KM4c5mD1',
  clientSecret: process.env.AMADEUS_API_SECRET || 'mvoeMRpVhsIAxseJ'
}); 