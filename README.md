# ALX Polly - Polling Application

A modern, secure polling application built with Next.js and Supabase that allows users to create, share, and vote on polls with QR code integration.

## 🎯 Project Overview

ALX Polly is a full-stack web application designed to facilitate easy poll creation and voting. Users can register, create polls with multiple options, and share them via unique links and QR codes for others to vote on. The application emphasizes security, user experience, and modern web development practices.

### Key Features

- **User Authentication**: Secure registration and login with Supabase Auth
- **Poll Management**: Create, edit, and delete polls with dynamic options
- **Voting System**: Support for both authenticated and anonymous voting
- **QR Code Sharing**: Generate QR codes for easy poll sharing
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui
- **Security First**: Comprehensive input sanitization and authorization checks
- **Real-time Updates**: Dynamic UI updates with Next.js caching

## 🛠 Tech Stack

### Frontend

- **Framework**: Next.js 15.4.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API + Server Components

### Backend & Database

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js Server Actions
- **Session Management**: Supabase SSR

### Security & Utilities

- **Input Sanitization**: Custom XSS prevention utilities
- **Rate Limiting**: In-memory rate limiting for critical endpoints
- **Password Security**: bcryptjs for password hashing
- **Form Validation**: React Hook Form with Zod

## 🔐 Security Audit & Remediation

A thorough security audit was performed on the original codebase, revealing several critical vulnerabilities that have since been remediated.

### 1. Cross-Site Scripting (XSS) 🛡️

- Vulnerability: The original application rendered user-submitted content directly to the page without proper sanitization, allowing for the injection of malicious scripts.

- Remediation: Server-side input sanitization was implemented. A new utility (sanitizeText) was created to strip dangerous HTML tags and protocols from user input, ensuring tainted data never reaches the database or the client.

### 2. Insecure Direct Object Reference (IDOR) 🔒

- Vulnerability: The backend lacked proper authorization checks, allowing a user to access or modify any poll simply by changing the ID in the URL.

- Remediation: Proper authorization checks were added. The getPollById server action now verifies that the user_id of the poll matches the user_id of the currently authenticated user, preventing unauthorized access.

### 3. Lack of Rate Limiting 🛑

- Vulnerability: Critical endpoints (e.g., login, poll submission) were not rate-limited, making the application vulnerable to brute-force attacks and spamming.

- Remediation: An in-memory rate limiter was added to the middleware.ts file, restricting the number of requests from a single IP address to key routes.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd alx-polly
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SECRET_KEY=your_supabase_secret_key
   ```

4. **Set up Supabase database**

   Create the following tables in your Supabase project:

   ```sql
   -- Polls table
   CREATE TABLE polls (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     question TEXT NOT NULL,
     options TEXT[] NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Votes table
   CREATE TABLE votes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
     user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
     option_index INTEGER NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
   ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

   -- Create RLS policies
   CREATE POLICY "Users can view their own polls" ON polls
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can create polls" ON polls
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own polls" ON polls
     FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete their own polls" ON polls
     FOR DELETE USING (auth.uid() = user_id);

   CREATE POLICY "Anyone can view votes" ON votes
     FOR SELECT USING (true);

   CREATE POLICY "Anyone can create votes" ON votes
     FOR INSERT WITH CHECK (true);
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Examples

### Creating a Poll

1. **Register/Login**: Create an account or sign in
2. **Navigate to Create**: Go to `/create` page
3. **Fill Form**: Enter poll question and options
4. **Submit**: Click "Create Poll" to save

```typescript
// Example poll creation
const formData = new FormData();
formData.append("question", "What is your favorite programming language?");
formData.append("options", "JavaScript");
formData.append("options", "Python");
formData.append("options", "TypeScript");

const result = await createPoll(formData);
```

### Voting on a Poll

1. **Access Poll**: Click on a poll card or use direct link
2. **Select Option**: Choose your preferred option
3. **Submit Vote**: Click "Submit Vote" button

```typescript
// Example voting
const result = await submitVote("poll-id", 0); // Vote for first option
```

### Managing Polls

- **View All Polls**: Dashboard shows all your created polls
- **Edit Poll**: Click "Edit" button to modify poll details
- **Delete Poll**: Click "Delete" with confirmation dialog
- **Share Poll**: Use generated links or QR codes

## 🏗 Project Structure

```
alx-polly/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/page.tsx        # Login page
│   │   └── register/page.tsx     # Registration page
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── create/               # Poll creation
│   │   ├── polls/                # Poll management
│   │   └── admin/                # Admin features
│   ├── components/               # Shared components
│   ├── lib/                      # Application logic
│   │   ├── actions/              # Server Actions
│   │   ├── context/              # React Context
│   │   └── types/                # TypeScript types
│   └── globals.css               # Global styles
├── components/                   # Reusable UI components
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase configuration
│   └── utils.ts                  # Utility functions
├── middleware.ts                 # Next.js middleware
└── README.md                     # This file
```

## 🔒 Security Features

### Input Sanitization

- XSS prevention through HTML tag removal
- Dangerous protocol filtering (javascript:, data:)
- Control character removal
- Comprehensive text sanitization utilities

### Authentication & Authorization

- Supabase Auth integration
- Row Level Security (RLS) policies
- Server-side authorization checks
- Session management with secure cookies

### Rate Limiting

- In-memory rate limiting for critical endpoints
- Protection against brute force attacks
- Configurable limits and windows

### Data Protection

- Secure password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention through Supabase
- CSRF protection via SameSite cookies

## 🧪 Testing

### Running Tests

```bash
# Type checking
npm run tsc

# Linting
npm run lint

# Build verification
npm run build
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Poll creation with various option counts
- [ ] Poll editing and deletion
- [ ] Voting functionality (authenticated and anonymous)
- [ ] QR code generation and sharing
- [ ] Responsive design on different screen sizes
- [ ] Error handling and validation

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

- **Netlify**: Use Next.js build output
- **Railway**: Deploy with Node.js runtime
- **Docker**: Use provided Dockerfile

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SECRET_KEY=your_production_secret_key
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and linting: `npm run lint && npm run tsc`
5. Commit changes: `git commit -m "Add feature"`
6. Push to branch: `git push origin feature-name`
7. Create a Pull Request

### Code Standards

- Use TypeScript for all new code
- Follow existing naming conventions
- Add comprehensive documentation for new functions
- Include error handling and validation
- Write tests for new features

### Version Constraints

- Node.js: 18+
- Next.js: 15.4.1
- React: 19.1.0
- TypeScript: 5+

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**Q: Environment variables not loading**
A: Ensure `.env.local` is in the root directory and restart the dev server.

**Q: Database connection errors**
A: Verify Supabase URL and keys are correct in environment variables.

**Q: Authentication not working**
A: Check Supabase Auth settings and RLS policies.

**Q: Build errors**
A: Run `npm run tsc` to check for TypeScript errors.

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Review the [Supabase documentation](https://supabase.com/docs)
- Consult the [Next.js documentation](https://nextjs.org/docs)

---

Built with ❤️ using Next.js, Supabase, and modern web technologies.
