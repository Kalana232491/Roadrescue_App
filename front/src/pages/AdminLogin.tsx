import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { auth, type LoginData } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<LoginData>();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await auth.login(data);
      if (response.data.user.role !== 'admin') {
        toast.error('This portal is restricted to admin accounts.');
        return;
      }

      login(response.data.token, response.data.user);
      toast.success('Welcome back, admin!');
      navigate('/admin', { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Admin login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <Card className="w-full max-w-md shadow-large">
        <CardHeader className="text-center space-y-2">
          <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>Secure access for platform administrators</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="usernameOrPhone">Username or Phone</Label>
              <Input
                id="usernameOrPhone"
                {...form.register('usernameOrPhone', { required: true })}
                placeholder="Enter admin username or phone"
                autoComplete="username"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register('password', { required: true })}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In as Admin
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Looking for the standard portal?{' '}
            <Link to="/auth" className="text-primary hover:underline">
              Go to user login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
