import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { FlightService } from '../services/flightService';
import { JetlagCalculationService } from '../services/jetlagService';

const app = express();
const router = Router();
const port = process.env.PORT || 3000;

// Initialize services
const flightService = new FlightService();
const jetlagService = new JetlagCalculationService();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jetlag API',
      version: '1.0.0',
      description: 'API for calculating jetlag adaptation plans based on flight schedules'
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'API Server'
      }
    ]
  },
  apis: ['./src/api/*.ts']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /api/flights/search:
 *   get:
 *     summary: Search for flights and get jetlag adaptation plan
 *     parameters:
 *       - in: query
 *         name: carrier
 *         required: true
 *         schema:
 *           type: string
 *         description: Airline carrier code
 *       - in: query
 *         name: flightNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Flight number
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *         description: Flight date (YYYY-MM-DD)
 */
router.get('/flights/search', (async (req: Request, res: Response) => {
  try {
    const { carrier, flightNumber, date } = req.query;
    
    if (!carrier || !flightNumber || !date) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const flights = await flightService.searchFlights(
      carrier as string,
      flightNumber as string,
      date as string
    );

    if (!flights || flights.length === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    const flight = flights[0];
    const adaptationInput = {
      ...flight,
      departureTime: new Date(flight.departureTime),
      arrivalTime: new Date(flight.arrivalTime)
    };

    const adaptationPlan = await jetlagService.calculateJetlagAdaptation(adaptationInput);
    return res.json({ flight, adaptationPlan });
  } catch (error) {
    console.error('Error searching flights:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}) as express.RequestHandler);

/**
 * @swagger
 * /api/airports/{iataCode}:
 *   get:
 *     summary: Get airport details by IATA code
 *     parameters:
 *       - in: path
 *         name: iataCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Airport IATA code
 */
app.get('/api/airports/:iataCode', (async (req: Request, res: Response) => {
  try {
    const { iataCode } = req.params;
    const airport = await flightService.getAirportDetails(iataCode);
    return res.json(airport);
  } catch (error) {
    console.error('Error getting airport details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}) as express.RequestHandler);

// Mount router
app.use('/api', router);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API documentation available at http://localhost:${port}/api-docs`);
}); 