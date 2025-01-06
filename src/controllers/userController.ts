import { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Create a new user
   */
  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const userRecord = await this.userService.createUser(email, password);
      res.status(201).json({ user: userRecord });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Get user profile
   */
  public async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const uid = req.params.uid;
      const userRecord = await this.userService.getUserById(uid);
      res.json({ user: userRecord });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Update user preferences
   */
  public async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const uid = req.params.uid;
      const preferences = req.body.preferences;

      if (!preferences) {
        res.status(400).json({ error: 'Preferences object is required' });
        return;
      }

      await this.userService.updateUserPreferences(uid, preferences);
      res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Get user's flight history
   */
  public async getFlightHistory(req: Request, res: Response): Promise<void> {
    try {
      const uid = req.params.uid;
      const history = await this.userService.getFlightHistory(uid);
      res.json({ history });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Delete user account
   */
  public async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const uid = req.params.uid;
      await this.userService.deleteUser(uid);
      res.json({ message: 'User account deleted successfully' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }
} 