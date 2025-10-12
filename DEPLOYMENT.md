# 🚀 Deployment Guide

## Development Setup (Current)

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Git

### Quick Start
1. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python app/seed_data.py  # Create sample data
   python main.py           # Start backend on http://localhost:8000
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev             # Start frontend on http://localhost:3000
   ```

3. **Test the Application**:
   ```bash
   cd backend
   python test_api.py      # Run API tests
   ```

## Production Deployment

### Option 1: Docker Deployment (Recommended)

1. **Configure Environment**:
   ```bash
   # Update backend/.env with production settings
   DATABASE_URL=postgresql://user:password@db:5432/barbershop_db
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   FROM_EMAIL=your-email@gmail.com
   SECRET_KEY=your-production-secret-key
   FRONTEND_URL=https://your-domain.com
   BACKEND_URL=https://api.your-domain.com
   ```

2. **Deploy with Docker Compose**:
   ```bash
   docker-compose up --build -d
   ```

### Option 2: Manual Deployment

#### Backend (FastAPI)
- Deploy to platforms like Railway, Render, or DigitalOcean
- Set up PostgreSQL database
- Configure environment variables
- Install dependencies and run with `uvicorn main:app --host 0.0.0.0 --port 8000`

#### Frontend (Next.js)
- Deploy to Vercel, Netlify, or similar
- Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url`
- Build and deploy: `npm run build && npm start`

### Email Configuration

For production email delivery, configure one of:

1. **Gmail SMTP** (for small scale):
   - Enable 2FA on Gmail account
   - Generate App Password
   - Use in SMTP_PASSWORD

2. **SendGrid** (recommended for production):
   - Sign up for SendGrid account
   - Get API key
   - Update email service to use SendGrid API

3. **AWS SES** (for AWS deployments):
   - Configure AWS SES
   - Update email service accordingly

### Database Migration

For production with PostgreSQL:

1. Install psycopg2-binary: `pip install psycopg2-binary`
2. Update DATABASE_URL in .env
3. Run: `python app/seed_data.py` to create initial data

### Security Considerations

- [ ] Change SECRET_KEY in production
- [ ] Use HTTPS for all endpoints
- [ ] Configure CORS properly for production domains
- [ ] Set up proper database backups
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging

### Monitoring

- Backend health check: `GET /` returns API status
- Database connectivity: Check appointment creation
- Email delivery: Monitor SMTP logs
- Frontend: Check booking flow end-to-end

## Testing

### Backend Tests
```bash
cd backend
python test_api.py      # API integration tests
python test_email.py    # Email functionality test
```

### Frontend Tests
```bash
cd frontend
npm test               # Run React tests (when added)
```

### Manual Testing Checklist
- [ ] Book appointment through frontend
- [ ] Receive confirmation email
- [ ] Click confirmation link
- [ ] View appointments in admin dashboard
- [ ] Create new barber in admin
- [ ] Test responsive design on mobile

## Troubleshooting

### Common Issues

1. **CORS Errors**: Update CORS origins in `main.py`
2. **Database Connection**: Check DATABASE_URL format
3. **Email Not Sending**: Verify SMTP credentials
4. **Frontend API Calls Failing**: Check NEXT_PUBLIC_API_URL

### Logs
- Backend: Check uvicorn logs
- Frontend: Check browser console
- Database: Check SQLite file or PostgreSQL logs

## Performance Optimization

### Backend
- Add database indexing for frequently queried fields
- Implement caching for barber/service data
- Add request rate limiting

### Frontend
- Optimize images and assets
- Implement lazy loading
- Add service worker for offline functionality

### Database
- Regular backups
- Query optimization
- Connection pooling for high traffic
