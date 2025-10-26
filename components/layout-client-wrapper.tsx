'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import React from 'react';

export function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname.startsWith('/auth');

    return (
        <>
            {!isAuthPage && <Navbar />}
            <main>{children}</main>
        </>
    );
}