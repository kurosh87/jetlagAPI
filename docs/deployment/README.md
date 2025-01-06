# Deployment Guide

## Prerequisites

- Firebase CLI installed
- Firebase project created
- Vercel account (optional, for API deployment)
- Environment variables configured

## Environment Setup

1. Create production environment file:
```bash
cp .env.example .env.production
```

2. Configure production variables:
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Firebase Configuration
FIREBASE_PROJECT_ID=tripbase-13c00
FIREBASE_STORAGE_BUCKET=tripbase-13c00.firebasestorage.app
FIREBASE_EMULATOR=false

# External API Keys
AMADEUS_API_KEY=your-production-amadeus-key
AMADEUS_API_SECRET=your-production-amadeus-secret
FLIGHTAWARE_API_KEY=your-production-flightaware-key
```

## Firebase Deployment

1. Deploy Firebase configuration:
```bash
npm run deploy
```

This will deploy:
- Firestore security rules
- Storage security rules
- Firebase indexes

2. Deploy only security rules:
```bash
npm run deploy:rules
```

## API Deployment

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Option 2: Self-hosted

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start npm --name "jetlag-api" -- start
```

## Deployment Checklist

### Pre-deployment
- [ ] Run tests: `npm test`
- [ ] Check for linting errors: `npm run lint`
- [ ] Update dependencies: `npm update`
- [ ] Set production environment variables
- [ ] Check API keys and credentials
- [ ] Review security rules

### Deployment Steps
1. Deploy Firebase configuration
2. Deploy API
3. Verify environment variables
4. Test production endpoints
5. Monitor logs and performance

### Post-deployment
- [ ] Verify API endpoints
- [ ] Check Firebase Console
- [ ] Monitor error rates
- [ ] Test user authentication
- [ ] Verify data access

## Monitoring and Maintenance

### Firebase Console
- Monitor Authentication usage
- Check Firestore queries
- Review Storage usage
- Analyze performance

### API Monitoring
- Set up health checks
- Configure error alerting
- Monitor rate limits
- Track API usage

### Logging
```typescript
// Example logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'jetlag-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Backup and Recovery

### Firestore Backup
```bash
# Export Firestore data
gcloud firestore export gs://[BUCKET_NAME]/[BACKUP_PATH]
```

### Database Maintenance
- Schedule regular backups
- Clean up old data
- Monitor database size
- Optimize indexes

## Security Considerations

1. **API Security**
   - Use HTTPS
   - Implement rate limiting
   - Validate input data
   - Set CORS policies

2. **Firebase Security**
   - Review security rules
   - Monitor authentication
   - Audit data access
   - Update credentials

3. **Environment Security**
   - Secure API keys
   - Rotate credentials
   - Use secret management
   - Monitor access logs

## Scaling

### Firebase Scaling
- Monitor usage limits
- Optimize queries
- Use caching
- Implement sharding

### API Scaling
- Use load balancing
- Implement caching
- Optimize database queries
- Monitor performance

## Troubleshooting

### Common Issues

1. **Deployment Failures**
```bash
# Check logs
vercel logs
firebase deploy --debug
```

2. **Performance Issues**
- Review Firebase usage
- Check API response times
- Monitor database queries
- Analyze error logs

3. **Authentication Problems**
- Verify credentials
- Check security rules
- Review access logs
- Test auth flow

## Rollback Procedures

1. **API Rollback**
```bash
# Vercel rollback
vercel rollback

# Manual rollback
git checkout [previous-version]
npm run deploy
```

2. **Firebase Rollback**
```bash
# Restore Firestore backup
gcloud firestore import gs://[BUCKET_NAME]/[BACKUP_PATH]

# Rollback security rules
firebase deploy --only firestore:rules --rollback
```

## Support and Maintenance

### Regular Maintenance
- Update dependencies
- Review security rules
- Monitor performance
- Backup data

### Support Procedures
1. Monitor error reports
2. Review user feedback
3. Update documentation
4. Maintain changelog

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp)
- [TypeScript Documentation](https://www.typescriptlang.org/docs) 