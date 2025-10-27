'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/auth');
    };

    return (
        <nav className="border-b">
            <div className="container mx-auto flex items-center justify-between h-16 px-4">
                <h1 className="text-xl font-bold select-none pointer-events-none">
                    Utaite Birthday Notifier Bot
                </h1>
                <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <Button aria-label="Log out" onClick={handleLogout} variant="outline" className="ml-2 cursor-pointer">ログアウト</Button>
                </div>
            </div>
        </nav>
    );
}
