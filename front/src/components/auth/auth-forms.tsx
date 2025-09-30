import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { auth, type LoginData, type RegisterData } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function AuthForms() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginData>();
  const registerForm = useForm<RegisterData>();

  const onLogin = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await auth.login(data);
      if (response.data.user.role === 'admin') {
        toast.error('Admins must sign in via the admin portal.');
        return;
      }
      login(response.data.token, response.data.user);
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterData) => {
    if (data.password !== data.password2) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await auth.register(data);
      login(response.data.token, response.data.user);
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-hover p-4">
      <Card className="w-full max-w-md shadow-large">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Road Rescue</CardTitle>
          <CardDescription>Professional automotive services platform</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="usernameOrPhone">Username or Phone</Label>
                  <Input
                    id="usernameOrPhone"
                    {...loginForm.register('usernameOrPhone', { required: true })}
                    placeholder="Enter username or phone"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...loginForm.register('password', { required: true })}
                    placeholder="Enter password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Admin user? <Link to="/admin-login" className="text-primary hover:underline">Use the admin portal</Link>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    {...registerForm.register('username', { required: true })}
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    {...registerForm.register('phone', { required: true })}
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={(value) => registerForm.setValue('role', value as 'provider' | 'recipient')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recipient">Service Recipient</SelectItem>
                      <SelectItem value="provider">Service Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="registerPassword">Password</Label>
                  <Input
                    id="registerPassword"
                    type="password"
                    {...registerForm.register('password', { required: true })}
                    placeholder="Create password"
                  />
                </div>

                <div>
                  <Label htmlFor="password2">Confirm Password</Label>
                  <Input
                    id="password2"
                    type="password"
                    {...registerForm.register('password2', { required: true })}
                    placeholder="Confirm password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
