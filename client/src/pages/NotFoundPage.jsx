import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'
import { EmptyState } from '../components/StatusMessage.jsx'

export default function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      hint="That address does not match any SeatSaver page."
      action={<Button as={Link} to="/" variant="ghost">Back to events</Button>}
    />
  )
}
