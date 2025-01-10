import { VercelRequest, VercelResponse } from '@vercel/node';
import { ChronotypeCategory, UserProfile, SleepQuality } from '../src/types/chronotype';

const CHRONOTYPE_QUESTIONS = [
  {
    id: 'q1',
    text: 'On a free day (no work/commitments), what time would you naturally go to bed?',
    type: 'TIME_SELECT',
    options: ['Before 21:00', '21:00-22:00', '22:00-23:00', '23:00-00:00', 'After 00:00']
  },
  {
    id: 'q2',
    text: 'How long does it typically take you to fall asleep?',
    type: 'DURATION_SELECT',
    options: ['Less than 15 minutes', '15-30 minutes', '30-60 minutes', 'More than 60 minutes']
  },
  {
    id: 'q3',
    text: 'Can you usually take naps during the day?',
    type: 'BOOLEAN_SELECT',
    options: ['Yes', 'No', 'Sometimes']
  }
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    return res.status(200).json({ questions: CHRONOTYPE_QUESTIONS });
  }

  if (req.method === 'POST') {
    try {
      const {
        age,
        sleepProfile
      } = req.body;

      // Validate required fields
      if (!age || !sleepProfile) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'age and sleepProfile are required'
        });
      }

      // Validate sleep profile
      const {
        typicalBedTime,
        typicalWakeTime,
        sleepQuality,
        sleepLatency,
        canNap,
        consistentSchedule
      } = sleepProfile;

      if (!typicalBedTime || !typicalWakeTime || !sleepQuality) {
        return res.status(400).json({
          error: 'Invalid sleep profile',
          details: 'typicalBedTime, typicalWakeTime, and sleepQuality are required'
        });
      }

      // Determine chronotype based on sleep schedule
      const bedTimeHour = parseInt(typicalBedTime.split(':')[0]);
      const wakeTimeHour = parseInt(typicalWakeTime.split(':')[0]);
      
      let chronotype: ChronotypeCategory;
      if (bedTimeHour <= 21 && wakeTimeHour <= 5) {
        chronotype = ChronotypeCategory.EARLY_MORNING;
      } else if (bedTimeHour <= 22 && wakeTimeHour <= 6) {
        chronotype = ChronotypeCategory.MODERATE_MORNING;
      } else if (bedTimeHour >= 0 || wakeTimeHour >= 8) {
        chronotype = ChronotypeCategory.LATE_EVENING;
      } else {
        chronotype = ChronotypeCategory.MODERATE_EVENING;
      }

      // Generate recommendations
      const recommendations = {
        optimalSleepWindow: {
          start: typicalBedTime,
          end: typicalWakeTime
        },
        lightExposurePreference: {
          morning: chronotype === ChronotypeCategory.EARLY_MORNING || 
                  chronotype === ChronotypeCategory.MODERATE_MORNING ? 'CRITICAL' : 'MODERATE',
          evening: chronotype === ChronotypeCategory.LATE_EVENING || 
                  chronotype === ChronotypeCategory.MODERATE_EVENING ? 'CRITICAL' : 'MODERATE'
        },
        adaptationSpeed: age > 60 ? 'SLOW' : sleepQuality === SleepQuality.POOR ? 'SLOW' : 'NORMAL',
        napRecommendation: canNap ? {
          timing: 'MID_AFTERNOON',
          duration: '20-30 minutes'
        } : null
      };

      return res.status(200).json({
        profile: {
          age,
          chronotype,
          sleepProfile
        },
        recommendations
      });

    } catch (error) {
      console.error('Error processing chronotype profile:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: 'An error occurred while processing the chronotype profile'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 