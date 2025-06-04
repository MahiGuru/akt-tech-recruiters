# AKT Talents - Modern Recruiting Platform

A beautiful, modern recruiting platform built with Next.js, Tailwind CSS, and PostgreSQL.

## Features

### For Job Seekers (Employees)
- ✅ User registration and authentication
- ✅ Profile management with resume upload
- ✅ Browse and search job listings
- ✅ Apply to jobs with one click
- ✅ Track application status
- ✅ Beautiful, responsive dashboard

### For Employers
- ✅ Company registration and authentication
- ✅ Post job openings with detailed descriptions
- ✅ Manage job postings
- ✅ View and manage applications
- ✅ Comprehensive employer dashboard

### Technical Features
- ✅ Modern, responsive UI with Tailwind CSS
- ✅ Smooth animations with Framer Motion
- ✅ PostgreSQL database with Prisma ORM
- ✅ RESTful API endpoints
- ✅ Form validation with React Hook Form
- ✅ Toast notifications
- ✅ Role-based access control

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT implementation
- **UI Components**: Headless UI, Lucide React icons
- **Animations**: Framer Motion
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd recruiting-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database URL:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/recruiting_db"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Database Schema

The application uses the following main models:

- **User**: Stores user information for both employees and employers
- **Job**: Job postings created by employers
- **Application**: Applications submitted by employees for jobs

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Jobs
- `GET /api/jobs` - Get all active jobs (or employer's jobs)
- `POST /api/jobs` - Create a new job posting

### Applications
- `GET /api/applications` - Get applications (filtered by user)
- `POST /api/applications` - Submit a job application

## Project Structure

```
app/
├── page.js                 # Landing page
├── layout.js              # Root layout
├── globals.css            # Global styles
├── auth/
│   ├── login/page.js      # Login page
│   └── register/page.js   # Registration page
├── jobs/page.js           # Job listings page
├── post-job/page.js       # Job posting form
├── dashboard/
│   ├── employee/page.js   # Employee dashboard
│   └── employer/page.js   # Employer dashboard
└── api/                   # API routes
    ├── auth/
    ├── jobs/
    └── applications/

lib/
└── prisma.js             # Prisma client

prisma/
└── schema.prisma         # Database schema
```

## Features in Detail

### Beautiful UI/UX
- Modern gradient backgrounds and glassmorphism effects
- Smooth animations and micro-interactions
- Responsive design that works on all devices
- Intuitive navigation and user flows

### Smart Job Matching
- Advanced search and filtering capabilities
- Location-based job filtering
- Job type categorization
- Skill-based recommendations

### Comprehensive Dashboards
- **Employee Dashboard**: Profile management, application tracking, job recommendations
- **Employer Dashboard**: Job management, application review, candidate analytics

### Security & Performance
- Secure password hashing with bcrypt
- Input validation and sanitization
- Optimized database queries
- Responsive image loading

## Deployment

### Database Setup
1. Set up a PostgreSQL database (recommended: Railway, Supabase, or Neon)
2. Update your `DATABASE_URL` in environment variables
3. Run `npx prisma db push` to create tables

### Deploy to Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
