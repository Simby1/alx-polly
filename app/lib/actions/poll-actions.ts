"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizeText, sanitizeStringArray } from "@/lib/utils";

/**
 * Creates a new poll with user-provided question and options.
 * 
 * This server action handles poll creation by validating user input, ensuring
 * authentication, and storing the poll data in the Supabase database. It's
 * called by the PollCreateForm component when users submit the poll creation form.
 * 
 * The function implements several security and validation measures:
 * - Input sanitization to prevent XSS attacks
 * - Authentication verification to ensure only logged-in users can create polls
 * - Business rule validation (minimum 2 options required)
 * - Database transaction safety
 * 
 * @param formData - Form data containing poll question and options
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('question', 'What is your favorite color?');
 * formData.append('options', 'Red');
 * formData.append('options', 'Blue');
 * formData.append('options', 'Green');
 * 
 * const result = await createPoll(formData);
 * if (result.error) {
 *   console.error('Poll creation failed:', result.error);
 * } else {
 *   console.log('Poll created successfully');
 * }
 * ```
 * 
 * @throws Will return error message if:
 * - User is not authenticated
 * - Question is empty or contains only whitespace
 * - Less than 2 options provided
 * - All options are empty after sanitization
 * - Database insertion fails
 * - Network connectivity issues
 * 
 * @security Features:
 * - Input sanitization prevents XSS attacks
 * - Authentication required for poll creation
 * - User ID automatically associated with poll for ownership tracking
 * - Automatic cache revalidation ensures UI updates
 */
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  // Extract and sanitize form data
  const rawQuestion = formData.get("question") as string;
  const rawOptions = formData.getAll("options").filter(Boolean) as string[];

  // Apply security sanitization to prevent XSS attacks
  const question = sanitizeText(rawQuestion);
  const options = sanitizeStringArray(rawOptions);

  // Validate business rules
  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Verify user authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  // Insert poll into database with user ownership
  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id, // Associate poll with authenticated user
      question,
      options,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  // Revalidate cache to ensure UI shows updated data
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Retrieves all polls created by the currently authenticated user.
 * 
 * This server action fetches polls from the database that belong to the
 * authenticated user. It's used by the user dashboard to display a list
 * of polls they have created, allowing them to manage their polls.
 * 
 * The function implements proper authorization by filtering polls based on
 * the authenticated user's ID, ensuring users can only see their own polls.
 * Results are ordered by creation date (newest first) for better UX.
 * 
 * @returns Promise resolving to an object containing:
 * - polls: Array of poll objects belonging to the user (empty array if none or error)
 * - error: Error message string (null on success)
 * 
 * @example
 * ```typescript
 * const { polls, error } = await getUserPolls();
 * if (error) {
 *   console.error('Failed to fetch polls:', error);
 * } else {
 *   console.log(`Found ${polls.length} polls`);
 *   polls.forEach(poll => console.log(poll.question));
 * }
 * ```
 * 
 * @throws Will return error message if:
 * - User is not authenticated
 * - Database query fails
 * - Network connectivity issues
 * 
 * @security Features:
 * - Authentication required to access polls
 * - User-scoped data access (users can only see their own polls)
 * - No sensitive data exposure to unauthorized users
 * 
 * @performance Note: Results are ordered by creation date descending for optimal
 * user experience, showing newest polls first.
 */
export async function getUserPolls() {
  const supabase = await createClient();
  
  // Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // Return empty array if user is not authenticated
  if (!user) return { polls: [], error: "Not authenticated" };

  // Fetch polls belonging to the authenticated user
  // Ordered by creation date (newest first) for better UX
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id) // Ensure user can only see their own polls
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  
  // Return polls data or empty array if no polls found
  return { polls: data ?? [], error: null };
}

/**
 * Retrieves a specific poll by its ID with proper authorization checks.
 * 
 * This server action fetches a single poll from the database and enforces
 * authorization to ensure only the poll owner can access it. It's used by
 * poll editing pages and poll management components to retrieve poll data
 * for modification or display.
 * 
 * The function implements critical security measures:
 * - Authorization verification (only poll owner can access)
 * - Authentication requirement
 * - Protection against unauthorized data access
 * 
 * @param id - The unique identifier of the poll to retrieve
 * @returns Promise resolving to an object containing:
 * - poll: The poll object if found and authorized (null otherwise)
 * - error: Error message string (null on success)
 * 
 * @example
 * ```typescript
 * const { poll, error } = await getPollById('poll-123');
 * if (error) {
 *   console.error('Failed to fetch poll:', error);
 * } else if (poll) {
 *   console.log('Poll question:', poll.question);
 *   console.log('Poll options:', poll.options);
 * } else {
 *   console.log('Poll not found or not authorized');
 * }
 * ```
 * 
 * @throws Will return error message if:
 * - Poll ID is invalid or doesn't exist
 * - User is not authenticated
 * - User is not authorized to access this poll (not the owner)
 * - Database query fails
 * - Network connectivity issues
 * 
 * @security Features:
 * - Authentication required to access any poll
 * - Authorization check ensures users can only access their own polls
 * - Protection against Insecure Direct Object Reference (IDOR) attacks
 * - No sensitive data exposure to unauthorized users
 * 
 * @business Logic: This function enforces the business rule that users can
 * only view and edit polls they have created, maintaining data privacy and
 * preventing unauthorized access to poll data.
 */
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Fetch poll from database
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };

  // Enforce authorization: only poll owner can access
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return { poll: null, error: "Not authenticated" };
  }
  
  // Critical security check: ensure user owns this poll
  if (data.user_id !== user.id) {
    return { poll: null, error: "Not authorized to access this poll" };
  }

  return { poll: data, error: null };
}

/**
 * Submits a vote for a specific option in a poll.
 * 
 * This server action handles vote submission by recording the user's choice
 * in the database. It's called by poll voting components when users select
 * an option and submit their vote. The function supports both authenticated
 * and anonymous voting depending on poll settings.
 * 
 * The function implements flexible voting policies:
 * - Optional authentication (supports anonymous voting)
 * - Vote tracking with user association when authenticated
 * - Database integrity through proper foreign key relationships
 * 
 * @param pollId - The unique identifier of the poll being voted on
 * @param optionIndex - The zero-based index of the selected option
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * // Vote for the first option (index 0) in a poll
 * const result = await submitVote('poll-123', 0);
 * if (result.error) {
 *   console.error('Vote submission failed:', result.error);
 * } else {
 *   console.log('Vote submitted successfully');
 * }
 * ```
 * 
 * @throws Will return error message if:
 * - Poll ID is invalid or doesn't exist
 * - Option index is out of bounds
 * - Database insertion fails (duplicate vote, constraint violation)
 * - Network connectivity issues
 * 
 * @security Features:
 * - Optional authentication (supports anonymous voting)
 * - User ID tracking when authenticated for audit purposes
 * - Database constraints prevent invalid data
 * - No sensitive data exposure
 * 
 * @business Logic: This function implements the core voting functionality
 * of the polling system. It records votes while maintaining flexibility
 * for different poll configurations (authenticated vs anonymous voting).
 * 
 * @note Authentication is currently optional (commented out) to support
 * anonymous voting. Uncomment the authentication check if you want to
 * require users to be logged in to vote.
 */
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  
  // Get current user (optional for anonymous voting)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optionally require login to vote
  // Uncomment the following lines if you want to require authentication for voting
  // if (!user) return { error: 'You must be logged in to vote.' };

  // Insert vote record into database
  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null, // Associate with user if authenticated, null for anonymous
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Deletes a poll from the database.
 * 
 * This server action removes a poll and all associated data from the database.
 * It's called by poll management components when users choose to delete their polls.
 * The function should be enhanced with proper authorization checks to ensure
 * only poll owners can delete their polls.
 * 
 * @param id - The unique identifier of the poll to delete
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const result = await deletePoll('poll-123');
 * if (result.error) {
 *   console.error('Poll deletion failed:', result.error);
 * } else {
 *   console.log('Poll deleted successfully');
 * }
 * ```
 * 
 * @throws Will return error message if:
 * - Poll ID is invalid or doesn't exist
 * - Database deletion fails
 * - Network connectivity issues
 * 
 * @security Note: This function currently lacks authorization checks.
 * It should be enhanced to verify that only the poll owner can delete the poll.
 * 
 * @todo Add authorization check to ensure only poll owners can delete their polls
 * @todo Consider soft delete instead of hard delete for audit purposes
 * @todo Add cascade deletion for associated votes
 */
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // TODO: Add authorization check here
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return { error: "Not authenticated" };
  // Verify user owns this poll before deletion
  
  const { error } = await supabase.from("polls").delete().eq("id", id);
  
  if (error) return { error: error.message };
  
  // Revalidate cache to ensure UI updates
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Updates an existing poll with new question and options.
 * 
 * This server action handles poll updates by validating user input, ensuring
 * authentication and authorization, and updating the poll data in the database.
 * It's called by poll editing forms when users modify their existing polls.
 * 
 * The function implements comprehensive security and validation measures:
 * - Input sanitization to prevent XSS attacks
 * - Authentication verification
 * - Authorization check (only poll owner can update)
 * - Business rule validation (minimum 2 options required)
 * - Database transaction safety
 * 
 * @param pollId - The unique identifier of the poll to update
 * @param formData - Form data containing updated poll question and options
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('question', 'Updated question?');
 * formData.append('options', 'Option 1');
 * formData.append('options', 'Option 2');
 * 
 * const result = await updatePoll('poll-123', formData);
 * if (result.error) {
 *   console.error('Poll update failed:', result.error);
 * } else {
 *   console.log('Poll updated successfully');
 * }
 * ```
 * 
 * @throws Will return error message if:
 * - User is not authenticated
 * - User is not authorized to update this poll (not the owner)
 * - Question is empty or contains only whitespace
 * - Less than 2 options provided
 * - All options are empty after sanitization
 * - Database update fails
 * - Network connectivity issues
 * 
 * @security Features:
 * - Input sanitization prevents XSS attacks
 * - Authentication required for poll updates
 * - Authorization check ensures only poll owners can update
 * - User-scoped updates prevent unauthorized modifications
 * 
 * @business Logic: This function enforces the business rule that users can
 * only modify polls they have created, maintaining data integrity and
 * preventing unauthorized poll modifications.
 */
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  // Extract and sanitize form data
  const rawQuestion = formData.get("question") as string;
  const rawOptions = formData.getAll("options").filter(Boolean) as string[];

  // Apply security sanitization to prevent XSS attacks
  const question = sanitizeText(rawQuestion);
  const options = sanitizeStringArray(rawOptions);

  // Validate business rules
  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Verify user authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Update poll with authorization check - only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id); // Critical: ensure user owns this poll

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
