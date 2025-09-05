"use client";

import Link from "next/link";
import { useAuth } from "@/app/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";

/**
 * Interface defining the structure of poll data for the PollActions component.
 * 
 * This interface represents the essential poll information needed for
 * displaying poll actions and management controls.
 * 
 * @interface Poll
 * @property id - Unique identifier for the poll
 * @property question - The poll question/title
 * @property options - Array of poll options
 * @property user_id - ID of the user who created the poll
 */
interface Poll {
  id: string;
  question: string;
  options: any[];
  user_id: string;
}

/**
 * Props interface for the PollActions component.
 * 
 * @interface PollActionsProps
 * @property poll - Poll object containing the data to display
 */
interface PollActionsProps {
  poll: Poll;
}

/**
 * PollActions component for displaying poll management controls.
 * 
 * This component renders a clickable poll card with management actions
 * (edit/delete) that are only visible to the poll owner. It provides
 * a clean interface for users to view their polls and perform actions
 * on them.
 * 
 * Key features:
 * - Clickable poll card that navigates to poll details
 * - Owner-only action buttons (edit/delete)
 * - Confirmation dialog for destructive actions
 * - Authentication-based UI rendering
 * - Responsive design with hover effects
 * 
 * State management:
 * - Uses authentication context to determine user permissions
 * - Handles delete confirmation through browser confirm dialog
 * - Manages page reload after successful deletion
 * 
 * @param props - Component props containing poll data
 * @returns JSX element representing a poll action card
 * 
 * @example
 * ```tsx
 * const poll = {
 *   id: 'poll-123',
 *   question: 'What is your favorite color?',
 *   options: ['Red', 'Blue', 'Green'],
 *   user_id: 'user-456'
 * };
 * 
 * <PollActions poll={poll} />
 * ```
 * 
 * @security Features:
 * - Owner-only action visibility (client-side check)
 * - Server-side authorization in delete action
 * - Confirmation dialog prevents accidental deletions
 * - Authentication context integration
 * 
 * @accessibility Features:
 * - Semantic HTML structure
 * - Clear visual hierarchy
 * - Keyboard navigation support
 * - Descriptive button labels
 */
export default function PollActions({ poll }: PollActionsProps) {
  // Get current user from authentication context
  const { user } = useAuth();
  
  /**
   * Handles poll deletion with user confirmation.
   * 
   * This function prompts the user for confirmation before deleting a poll.
   * It calls the server action to delete the poll and reloads the page
   * to reflect the changes in the UI.
   * 
   * @security Note: The actual authorization check happens in the server action.
   * This client-side check is for UX purposes only.
   */
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this poll?")) {
      await deletePoll(poll.id);
      window.location.reload(); // Refresh to show updated poll list
    }
  };

  return (
    <div className="border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white">
      <Link href={`/polls/${poll.id}`}>
        <div className="group p-4">
          <div className="h-full">
            <div>
              <h2 className="group-hover:text-blue-600 transition-colors font-bold text-lg">
                {poll.question}
              </h2>
              <p className="text-slate-500">{poll.options.length} options</p>
            </div>
          </div>
        </div>
      </Link>
      {user && user.id === poll.user_id && (
        <div className="flex gap-2 p-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/polls/${poll.id}/edit`}>Edit</Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
