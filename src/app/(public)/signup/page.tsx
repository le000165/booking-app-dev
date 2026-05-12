import type { Metadata } from 'next';
import AuthForm from '../login/AuthForm';

export const metadata: Metadata = {
  title: 'Start free — BookEasy',
  description: 'Create your BookEasy account and start accepting bookings.',
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
