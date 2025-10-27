'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AuthPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            router.push('/');
        } else {
            toast.error('Invalid username or password');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background px-4">
            <div className="w-full max-w-md">
                <form onSubmit={handleSignIn}>
                    <div className="bg-card text-card-foreground shadow-md rounded-lg px-6 pt-6 pb-8 mb-4">
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold">ログイン</h1>
                        </div>
                        <div className="mb-4">
                            <Label htmlFor="username">ユーザー名</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <Label htmlFor="password">パスワード</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="******************"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1"
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <Button aria-label="Sign in" type="submit" className="w-full cursor-pointer">
                                Sign In
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
