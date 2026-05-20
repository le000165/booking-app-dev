import type { Metadata } from 'next';
import AuthForm from './AuthForm';

export const metadata: Metadata = {
  title: 'Log in — Vero',
  description: 'Log in to your Vero dashboard.',
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
