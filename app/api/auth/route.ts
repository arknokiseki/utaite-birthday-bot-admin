import { NextResponse } from 'next/server';
import clientPromise, { dbName } from '@/lib/mongodb';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
    const { username, password } = await request.json();

    const client = await clientPromise;
    const db = client.db(dbName);
    const user = await db.collection('users').findOne({ username });

    if (user) {
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (isPasswordCorrect) {
            const response = NextResponse.json({ success: true });
            response.cookies.set('auth', 'true', { 
                httpOnly: true, 
                maxAge: 60 * 60 * 8
            });
            return response;
        }
    }

    return new Response('Unauthorized', { status: 401 });
}