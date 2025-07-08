# Anna University Paper Publication System

## Project Overview

This is a comprehensive paper publication management system designed for Anna University. The platform facilitates the submission, review, and management of academic papers with dedicated interfaces for administrators and reviewers.

## Features

- **Admin Dashboard**: Complete administrative control over paper submissions, reviewer assignments, and publication management
- **Reviewer Dashboard**: Dedicated interface for reviewers to evaluate and provide feedback on submitted papers
- **Paper Submission System**: Streamlined process for authors to submit their academic papers
- **Review Management**: Efficient workflow for managing the peer review process
- **User Authentication**: Secure login system with role-based access control

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:

```sh
git clone <YOUR_GIT_URL>
cd anna-university
```

2. Install dependencies:

```sh
npm install
```

3. Start the development server:

```sh
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technology Stack

This project is built with modern web technologies:

### Frontend

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **shadcn/ui** - High-quality, accessible UI components
- **React Router** - Client-side routing for single-page application

### Backend & Database

- **Supabase** - Backend-as-a-Service for authentication and database
- **PostgreSQL** - Robust relational database (via Supabase)

### Additional Libraries

- **React Query** - Data fetching and state management
- **React Hook Form** - Form handling and validation
- **Zod** - Schema validation
- **Lucide React** - Beautiful icons
- **Date-fns** - Date utility library

## Project Structure

```
anna-university/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Application pages
│   │   ├── Index.tsx       # Home page
│   │   ├── Login.tsx       # Authentication page
│   │   ├── AdminDashboard.tsx
│   │   ├── ReviewerDashboard.tsx
│   │   └── ReviewerSubmissions.tsx
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── integrations/       # External service integrations
├── supabase/               # Database migrations and functions
└── public/                 # Static assets
```

## Deployment

### Production Build

1. Create a production build:

```sh
npm run build
```

2. The built files will be in the `dist` directory, ready for deployment to any static hosting service.

### Deployment Options

- **Vercel**: Connect your GitHub repository for automatic deployments
- **Netlify**: Drag and drop the `dist` folder or connect via Git
- **GitHub Pages**: Use GitHub Actions for automated deployment
- **Firebase Hosting**: Deploy using Firebase CLI

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is developed for Anna University's paper publication system.
