import axios from 'axios';

const FLIGHTAWARE_API_KEY = 'LUNAkIqjrwGEMvFwtW6TPVVqIG2Jb4h7';
const BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';

export const flightAwareClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-apikey': FLIGHTAWARE_API_KEY,
    'Content-Type': 'application/json'
  }
}); 