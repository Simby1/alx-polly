import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Poll } from '@/app/lib/types';

/**
 * Props interface for the PollCard component.
 * 
 * This interface defines the structure of poll data that the PollCard component
 * expects to receive. It includes all necessary poll information for display
 * in the card format.
 * 
 * @interface PollCardProps
 * @property poll - Poll object containing display data
 */
interface PollCardProps {
  poll: {
    id: string; // Unique identifier for the poll
    title: string; // Poll question/title
    description?: string; // Optional poll description
    options: any[]; // Array of poll options
    votes?: number; // Total vote count (optional)
    createdAt: string | Date; // Creation timestamp
  };
}

/**
 * PollCard component for displaying poll information in a card format.
 * 
 * This component renders a clickable card that displays essential poll
 * information including the title, description, option count, vote count,
 * and creation date. It's used in poll listing pages to provide users
 * with a quick overview of available polls before clicking to view details.
 * 
 * The component implements several UX features:
 * - Clickable card that navigates to poll details
 * - Hover effects for better interactivity
 * - Responsive design with proper spacing
 * - Vote count calculation and display
 * - Date formatting for better readability
 * 
 * @param props - Component props containing poll data
 * @returns JSX element representing a poll card
 * 
 * @example
 * ```tsx
 * const poll = {
 *   id: 'poll-123',
 *   title: 'What is your favorite color?',
 *   description: 'Choose your preferred color',
 *   options: [
 *     { id: '1', text: 'Red', votes: 10 },
 *     { id: '2', text: 'Blue', votes: 15 }
 *   ],
 *   createdAt: '2023-10-15'
 * };
 * 
 * <PollCard poll={poll} />
 * ```
 * 
 * @accessibility Features:
 * - Semantic HTML structure with proper heading hierarchy
 * - Keyboard navigation support through Link component
 * - Clear visual feedback on hover states
 * - Readable text contrast and sizing
 */
export function PollCard({ poll }: PollCardProps) {
  // Calculate total votes from individual option votes or use provided total
  const totalVotes = poll.votes || poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);
  
  // Format creation date for display (handles both string and Date objects)
  const formattedDate = typeof poll.createdAt === 'string' 
    ? new Date(poll.createdAt).toLocaleDateString() 
    : poll.createdAt.toLocaleDateString();

  return (
    <Link href={`/polls/${poll.id}`} className="group block h-full">
      <Card className="h-full transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="group-hover:text-blue-600 transition-colors">
            {poll.title}
          </CardTitle>
          {poll.description && (
            <CardDescription>{poll.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-500">
            <p>{poll.options.length} options</p>
            <p>{totalVotes} total votes</p>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-slate-400">
          Created on {formattedDate}
        </CardFooter>
      </Card>
    </Link>
  );
}