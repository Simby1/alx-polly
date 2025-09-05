'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Authentication context interface defining the shape of auth state and methods.
 * 
 * This interface provides a centralized way to access authentication state
 * throughout the client-side components. It includes the current session,
 * user data, logout functionality, and loading state for auth operations.
 * 
 * @interface AuthContextType
 * @property session - Current Supabase session object (null if not authenticated)
 * @property user - Current authenticated user object (null if not authenticated)
 * @property signOut - Function to sign out the current user
 * @property loading - Boolean indicating if authentication state is being loaded
 */
interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => void;
  loading: boolean;
}

/**
 * Authentication context for managing user state across the application.
 * 
 * This context provides authentication state and methods to all child components
 * through React's context system. It manages the Supabase session lifecycle
 * and provides a centralized way to access user information and authentication
 * status throughout the client-side application.
 */
const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  user: null,
  signOut: () => {},
  loading: true,
});

/**
 * Authentication provider component that manages authentication state for the entire application.
 * 
 * This component wraps the application and provides authentication context to all child
 * components. It handles the initialization of authentication state, listens for auth
 * state changes, and provides methods for authentication operations.
 * 
 * Key responsibilities:
 * - Initialize authentication state on app load
 * - Listen for authentication state changes (login, logout, token refresh)
 * - Provide authentication state to child components via context
 * - Handle cleanup of authentication listeners
 * 
 * @param children - React components that will have access to authentication context
 * @returns JSX element providing authentication context to children
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Header />
 *       <MainContent />
 *       <Footer />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Create Supabase client instance (memoized to prevent recreation on re-renders)
  const supabase = useMemo(() => createClient(), []);
  
  // Authentication state management
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Initial loading state

  useEffect(() => {
    let mounted = true; // Flag to prevent state updates after component unmount

    /**
     * Initial authentication check - fetches current user on app load.
     * 
     * This function runs once when the component mounts to check if there's
     * an existing authenticated session. It's separate from the auth state change
     * listener to handle the initial load properly.
     */
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error fetching user:', error);
        // Don't throw error - just log it and continue with null user
      }
      
      // Only update state if component is still mounted
      if (mounted) {
        setUser(data.user ?? null);
        setSession(null); // Clear session on initial load - will be set by listener
        setLoading(false); // Initial load complete
        console.log('AuthContext: Initial user loaded', data.user);
      }
    };

    // Perform initial authentication check
    getUser();

    /**
     * Authentication state change listener.
     * 
     * This listener responds to all authentication events:
     * - SIGNED_IN: User successfully logged in
     * - SIGNED_OUT: User logged out
     * - TOKEN_REFRESHED: Session token was refreshed
     * - PASSWORD_RECOVERY: Password recovery initiated
     * 
     * The listener updates the context state whenever authentication status changes.
     */
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Don't set loading to false here - only after initial load
      // This prevents flickering during auth state changes
      console.log('AuthContext: Auth state changed', _event, session, session?.user);
    });

    // Cleanup function - unsubscribe from auth listener and prevent state updates
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Sign out function that clears the current user session.
   * 
   * This function is provided to child components through the context
   * to allow them to trigger user logout. It calls Supabase's signOut
   * method which handles session cleanup and cookie removal.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  console.log('AuthContext: user', user);
  
  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context throughout the application.
 * 
 * This hook provides a convenient way for components to access authentication
 * state and methods without having to import and use useContext directly.
 * It returns the current authentication context including user data, session
 * information, logout functionality, and loading state.
 * 
 * @returns AuthContextType object containing:
 * - session: Current Supabase session (null if not authenticated)
 * - user: Current authenticated user (null if not authenticated)
 * - signOut: Function to sign out the current user
 * - loading: Boolean indicating if auth state is being loaded
 * 
 * @example
 * ```tsx
 * function Header() {
 *   const { user, signOut, loading } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   
 *   return (
 *     <header>
 *       {user ? (
 *         <div>
 *           Welcome, {user.user_metadata?.name}!
 *           <button onClick={signOut}>Sign Out</button>
 *         </div>
 *       ) : (
 *         <div>Please log in</div>
 *       )}
 *     </header>
 *   );
 * }
 * ```
 * 
 * @throws Will throw an error if used outside of AuthProvider context
 * @see AuthProvider - The context provider that must wrap components using this hook
 */
export const useAuth = () => useContext(AuthContext);
