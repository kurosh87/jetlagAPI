import { Router } from 'express';
import { JetlagController } from '../controllers/jetlagController';

const router = Router();
const jetlagController = new JetlagController();

// Calculate jetlag and generate adaptation schedule
router.post('/calculate', jetlagController.calculateJetlag);

export default router; 