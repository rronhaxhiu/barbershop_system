# 💈 Barbershop Appointment System

A modern web application for managing barbershop appointments with email confirmation workflow.

## 🚀 Features

- **Client Booking**: No-login appointment booking with email confirmation
- **Admin Dashboard**: Manage barbers, services, and appointments
- **Email Confirmation**: Automatic email confirmation with unique links
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Availability**: Prevents overlapping bookings

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: FastAPI with SQLAlchemy
- **Database**: SQLite (development) / PostgreSQL (production)
- **Email**: SMTP integration for confirmations

## 📁 Project Structure

```
barbershop/
├── frontend/          # Next.js frontend application
├── backend/           # FastAPI backend application
├── docker-compose.yml # Docker setup for development
└── README.md
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Git

### Quick Start

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd barbershop
   ```

2. **Backend setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   python main.py
   ```

3. **Frontend setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📊 Data Model

- **Barber**: id, name, description, working_hours
- **Service**: id, barber_id, name, price, duration_minutes
- **Appointment**: id, barber_id, service_id, client details, datetime, status, confirmation_token

## 🔧 Configuration

Copy `.env.example` to `.env` in the backend directory and configure:

- Database connection
- SMTP email settings
- Application secrets
- Frontend/backend URLs

## 📝 API Endpoints

- `GET /api/barbers` - List all barbers
- `GET /api/barbers/{id}/services` - Get services for a barber
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/confirm/{token}` - Confirm appointment
- `GET /api/admin/appointments` - Admin: List appointments
- `POST /api/admin/barbers` - Admin: Create barber
- `POST /api/admin/services` - Admin: Create service

## 🚀 Deployment

### Using Docker

```bash
docker-compose up --build
```

### Manual Deployment

1. Set up PostgreSQL database
2. Configure production environment variables
3. Deploy backend to your preferred platform
4. Deploy frontend to Vercel/Netlify
5. Configure SMTP for email delivery

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📄 License

MIT License - see LICENSE file for details.
