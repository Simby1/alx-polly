'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

/**
 * Authenticates a user with email and password credentials.
 * 
 * This server action handles user login by validating credentials against the Supabase
 * authentication system. It's called by the LoginPage component when users submit
 * the login form. The function leverages Supabase's built-in authentication which
 * handles password verification, session creation, and JWT token generation.
 * 
 * @param data - Login credentials containing email and password
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const result = await login({ email: 'user@example.com', password: 'password123' });
 * if (result.error) {
 *   console.error('Login failed:', result.error);
 * } else {
 *   // User successfully logged in, session is now active
 * }
 * ```
 * 
 * @throws Will return error message if:
 * - Invalid email format
 * - Incorrect password
 * - User account doesn't exist
 * - Account is disabled or locked
 * - Network connectivity issues
 */
export async function login(data: LoginFormData) {
  const supabase = await createClient();

  // Attempt to sign in with provided credentials
  // Supabase handles password hashing verification and session creation
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    // Return error message for display in UI
    // Common errors: "Invalid login credentials", "Email not confirmed", etc.
    return { error: error.message };
  }

  // Success: no error - user session is now active
  // The session cookie is automatically set by Supabase middleware
  return { error: null };
}

/**
 * Creates a new user account with email, password, and profile information.
 * 
 * This server action handles user registration by creating a new account in the Supabase
 * authentication system. It's called by the RegisterPage component when users submit
 * the registration form. The function creates both the authentication record and stores
 * additional user metadata (name) in the user profile.
 * 
 * Note: Supabase handles password hashing automatically using bcrypt. The password
 * is never stored in plain text and follows security best practices.
 * 
 * @param data - Registration data containing name, email, and password
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const result = await register({ 
 *   name: 'John Doe', 
 *   email: 'john@example.com', 
 *   password: 'securePassword123' 
 * });
 * if (result.error) {
 *   console.error('Registration failed:', result.error);
 * } else {
 *   // User account created successfully
 * }
 * ```
 * 
 * @throws Will return error message if:
 * - Email already exists in the system
 * - Password doesn't meet security requirements (too weak, too short)
 * - Invalid email format
 * - Name is empty or contains invalid characters
 * - Network connectivity issues
 * 
 * @security Note: This function relies on Supabase's built-in security measures:
 * - Password strength validation
 * - Email uniqueness enforcement
 * - Automatic password hashing with bcrypt
 * - Protection against common attacks (timing attacks, etc.)
 */
export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  // Create new user account with Supabase Auth
  // The options.data field stores additional user metadata accessible via user.user_metadata
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name, // Stored in user_metadata for easy access
      },
    },
  });

  if (error) {
    // Return error message for display in UI
    // Common errors: "User already registered", "Password should be at least 6 characters", etc.
    return { error: error.message };
  }

  // Success: no error - user account created
  // Note: User may need to verify email depending on Supabase configuration
  return { error: null };
}

/**
 * Signs out the currently authenticated user and clears their session.
 * 
 * This server action handles user logout by invalidating the current session
 * and clearing authentication cookies. It's typically called by the Header
 * component's logout button or when users need to switch accounts.
 * 
 * The function uses Supabase's signOut method which:
 * - Invalidates the current JWT token
 * - Clears session cookies
 * - Redirects user to login page (handled by middleware)
 * 
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const result = await logout();
 * if (result.error) {
 *   console.error('Logout failed:', result.error);
 * } else {
 *   // User successfully logged out, session cleared
 * }
 * ```
 * 
 * @throws Will return error message if:
 * - No active session exists
 * - Network connectivity issues
 * - Supabase service unavailable
 */
export async function logout() {
  const supabase = await createClient();
  
  // Sign out the current user and clear session
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    // Return error message for display in UI
    return { error: error.message };
  }
  
  // Success: user session cleared
  return { error: null };
}

/**
 * Retrieves the currently authenticated user from the active session.
 * 
 * This server action fetches the current user's information from the Supabase
 * session. It's used throughout the application to check authentication status
 * and access user data. The function is called by components that need to
 * display user information or verify authentication.
 * 
 * @returns Promise resolving to the current user object or null if not authenticated
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('User is authenticated:', user.email);
 * } else {
 *   console.log('No authenticated user');
 * }
 * ```
 * 
 * @returns User object containing:
 * - id: Unique user identifier
 * - email: User's email address
 * - user_metadata: Additional user data (name, etc.)
 * - created_at: Account creation timestamp
 * - Or null if no active session exists
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  
  // Get current user from active session
  const { data } = await supabase.auth.getUser();
  
  // Return user object or null if not authenticated
  return data.user;
}

/**
 * Retrieves the current authentication session.
 * 
 * This server action fetches the complete session object including user data
 * and session metadata. It's used when components need access to session
 * information beyond just the user data, such as session expiration times
 * or access tokens.
 * 
 * @returns Promise resolving to the current session object or null if not authenticated
 * 
 * @example
 * ```typescript
 * const session = await getSession();
 * if (session) {
 *   console.log('Session expires at:', session.expires_at);
 *   console.log('Access token:', session.access_token);
 * } else {
 *   console.log('No active session');
 * }
 * ```
 * 
 * @returns Session object containing:
 * - user: Current user data
 * - access_token: JWT access token
 * - refresh_token: Token for refreshing the session
 * - expires_at: Session expiration timestamp
 * - Or null if no active session exists
 */
export async function getSession() {
  const supabase = await createClient();
  
  // Get current session with all metadata
  const { data } = await supabase.auth.getSession();
  
  // Return session object or null if not authenticated
  return data.session;
}
