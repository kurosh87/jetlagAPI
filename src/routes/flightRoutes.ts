import { Router } from 'express';
import { FlightController } from '../controllers/flightController';

const router = Router();
const flightController = new FlightController();

// Flight search and information routes
router.get('/search', (req, res) => flightController.searchFlights(req, res));
router.get('/airports', (req, res) => flightController.searchAirports(req, res));
router.get('/schedule', (req, res) => flightController.getFlightSchedule(req, res));
router.post('/:uid/history', (req, res) => flightController.saveFlightToHistory(req, res));

export default router; 