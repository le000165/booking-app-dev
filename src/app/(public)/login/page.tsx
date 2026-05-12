import type { Metadata } from 'next';
import AuthForm from './AuthForm';

export const metadata: Metadata = {
  title: 'Log in — BookEasy',
  description: 'Log in to your BookEasy dashboard.',
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
