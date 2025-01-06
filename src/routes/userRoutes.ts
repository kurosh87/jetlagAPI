import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

// User management routes
router.post('/register', (req, res) => userController.createUser(req, res));
router.get('/:uid/profile', (req, res) => userController.getProfile(req, res));
router.put('/:uid/preferences', (req, res) => userController.updatePreferences(req, res));
router.get('/:uid/flights', (req, res) => userController.getFlightHistory(req, res));
router.delete('/:uid', (req, res) => userController.deleteAccount(req, res));

export default router; 