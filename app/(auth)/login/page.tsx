"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { loginAction } from '@/actions/auth.actions';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@nodepos.com');
  const [password, setPassword] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const formData = new FormData(e.currentTarget);
        const result = await loginAction(formData);
        toast.success("Login successful");
        router.push(result.role === 'ADMIN' ? '/dashboard' : '/checkout');
        router.refresh();
    } catch (err: any) {
        toast.error(err.message || 'Login failed');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 font-bold text-2xl text-blue-600 tracking-tight">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <ShoppingCart size={24} />
                </div>
                NodePOS Pro
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Enter your credentials to access the POS</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4 rounded-md shadow-sm">
                    <div>
                        <label htmlFor="email" className="sr-only">Email address</label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </Button>
                </div>
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
