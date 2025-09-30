import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForms } from '@/components/auth/auth-forms';
import { useAuth } from '@/contexts/AuthContext';

export default function Auth() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return <AuthForms />;
}