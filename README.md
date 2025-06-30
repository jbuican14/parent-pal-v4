# ParentPal - Family Event Management App

A beautiful React Native app built with Expo for managing family events and activities.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Ollama Configuration (for event parsing)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

## Required Environment Variables

### Supabase Authentication
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to Settings → API
4. Copy the following:
   - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

## Features

- **Authentication**: Complete sign-up, login, and email verification flow
- **Family Management**: Add and manage children and family members
- **Event Tracking**: Create and track family events and activities
- **Email Integration**: Parse emails into structured events (with Ollama)
- **Row-Level Security**: Comprehensive data protection and user isolation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (see above)

3. Start the development server:
   ```bash
   npm run dev
   ```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run specific test files
npm test tests/authFlows.test.tsx
npm test tests/rls.test.ts

# Run with coverage
npm test -- --coverage
```

## Authentication Flow

The app includes a complete authentication system:

1. **Sign Up**: Users create accounts with email/password
2. **Email Verification**: Automatic polling for email confirmation
3. **Login**: Secure authentication with session persistence
4. **Session Management**: Automatic token refresh and storage

## Security

- Row-Level Security (RLS) policies protect user data
- Comprehensive test suite validates security configurations
- Session persistence with automatic refresh
- Secure token storage using AsyncStorage

## Architecture

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth)
- **Navigation**: Expo Router with tab-based layout
- **State Management**: React Context for authentication
- **Testing**: Jest + React Native Testing Library