"use client";

import { useState } from "react";
import { createPoll } from "@/app/lib/actions/poll-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * PollCreateForm component for creating new polls.
 * 
 * This component provides a user-friendly interface for creating polls with
 * dynamic option management. It handles form state, validation, and submission
 * using Next.js Server Actions for secure poll creation.
 * 
 * Key features:
 * - Dynamic option management (add/remove options)
 * - Form validation and error handling
 * - Success feedback with automatic redirect
 * - Minimum 2 options requirement (enforced by business logic)
 * - Server-side sanitization and security
 * 
 * State management:
 * - options: Array of poll option strings (minimum 2 required)
 * - error: Error message from server action (null on success)
 * - success: Boolean indicating successful poll creation
 * 
 * @returns JSX element containing the poll creation form
 * 
 * @example
 * ```tsx
 * // Used in create poll page
 * export default function CreatePollPage() {
 *   return (
 *     <div>
 *       <h1>Create New Poll</h1>
 *       <PollCreateForm />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @security Features:
 * - Server-side input sanitization prevents XSS attacks
 * - Authentication required for poll creation
 * - Form validation prevents invalid submissions
 * - Automatic redirect prevents duplicate submissions
 * 
 * @accessibility Features:
 * - Proper form labels and input associations
 * - Required field indicators
 * - Clear error and success messaging
 * - Keyboard navigation support
 */
export default function PollCreateForm() {
  // State management for form data and UI feedback
  const [options, setOptions] = useState(["", ""]); // Start with 2 empty options (minimum required)
  const [error, setError] = useState<string | null>(null); // Server-side error messages
  const [success, setSuccess] = useState(false); // Success state for UI feedback

  /**
   * Handles changes to individual poll options.
   * 
   * This function updates a specific option in the options array while
   * preserving all other options. It's called when users type in option
   * input fields.
   * 
   * @param idx - Index of the option being modified
   * @param value - New value for the option
   */
  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  /**
   * Adds a new empty option to the poll.
   * 
   * This function appends an empty string to the options array,
   * allowing users to create polls with more than 2 options.
   */
  const addOption = () => setOptions((opts) => [...opts, ""]);

  /**
   * Removes an option from the poll (with minimum 2 options constraint).
   * 
   * This function removes an option at the specified index while ensuring
   * that at least 2 options remain (business rule requirement). It's only
   * called when there are more than 2 options available.
   * 
   * @param idx - Index of the option to remove
   */
  const removeOption = (idx: number) => {
    if (options.length > 2) {
      setOptions((opts) => opts.filter((_, i) => i !== idx));
    }
  };

  return (
    <form
      action={async (formData) => {
        // Reset UI state before submission
        setError(null);
        setSuccess(false);
        
        // Submit form data to server action
        const res = await createPoll(formData);
        
        if (res?.error) {
          // Display error message to user
          setError(res.error);
        } else {
          // Show success message and redirect to polls list
          setSuccess(true);
          setTimeout(() => {
            window.location.href = "/polls";
          }, 1200); // 1.2 second delay to show success message
        }
      }}
      className="space-y-6 max-w-md mx-auto"
    >
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Input name="question" id="question" required />
      </div>
      <div>
        <Label>Options</Label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input
              name="options"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              required
            />
            {options.length > 2 && (
              <Button type="button" variant="destructive" onClick={() => removeOption(idx)}>
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={addOption} variant="secondary">
          Add Option
        </Button>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Poll created! Redirecting...</div>}
      <Button type="submit">Create Poll</Button>
    </form>
  );
} 