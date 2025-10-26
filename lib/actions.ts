'use server';

import { revalidatePath } from 'next/cache';
import clientPromise from './mongodb';
import { BirthdaySchema, CreateBirthdaySchema } from './definitions';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';

class AuthError extends Error {
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'AuthError';
  }
}

type State = {
    errors?: {
        id?: string[];
        utaiteName?: string[];
        birthday?: string[];
        twitterLink?: string[];
    };
    message: string;
};

async function checkAuth() {
    const authCookie = (await cookies()).get('auth');
    if (!authCookie) {
        throw new AuthError('Session expired. Please log in again.');
    }
}

const getBirthdaysCollection = async () => {
    if (!process.env.MONGODB_DB || !process.env.MONGODB_COLLECTION_NAME) {
        throw new Error('Server configuration error: MONGODB_DB_NAME or MONGODB_COLLECTION_NAME is not set.');
    }
    
    await checkAuth();
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    return db.collection(process.env.MONGODB_COLLECTION_NAME);
};

export async function getBirthdays() {
    try {
        const collection = await getBirthdaysCollection();
        const birthdays = await collection.find({})
            .collation({ locale: 'en', strength: 2 })
            .sort({ utaiteName: 1 })
            .toArray();

        return JSON.parse(JSON.stringify(birthdays));
    } catch (error) {
        console.error('getBirthdays failed:', error);
        if (error instanceof AuthError) {
             throw new Error(error.message);
        }
        throw new Error('Failed to fetch data from the server.');
    }
}

export async function createBirthday(_prevState: State, formData: FormData): Promise<State> {
    try {
        await checkAuth();
    } catch (error) {
        if (error instanceof AuthError) {
            return { message: error.message };
        }
        return { message: 'An unexpected authentication error occurred.' };
    }

    const validatedFields = CreateBirthdaySchema.safeParse({
        utaiteName: formData.get('utaiteName'),
        birthday: formData.get('birthday'),
        twitterLink: formData.get('twitterLink'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to create birthday. Please check the fields.',
        };
    }
    
    const { utaiteName, birthday, twitterLink } = validatedFields.data;

    try {
        const collection = await getBirthdaysCollection();
        await collection.insertOne({
            utaiteName,
            birthday,
            twitterLink,
            createdAt: new Date(),
        });
    } catch (error) { 
        console.error('Database Error (Create):', error);
        if (error instanceof AuthError) {
             return { message: error.message };
        }
        return { message: 'Database Error: Failed to create birthday.' };
    }

    revalidatePath('/');
    return { message: 'Successfully created birthday.' };
}

export async function updateBirthday(_prevState: State, formData: FormData): Promise<State> {
    try {
        await checkAuth();
    } catch (error) {
        if (error instanceof AuthError) {
            return { message: error.message };
        }
        return { message: 'An unexpected authentication error occurred.' };
    }
    
    const validatedFields = BirthdaySchema.safeParse({
        id: formData.get('id'),
        utaiteName: formData.get('utaiteName'),
        birthday: formData.get('birthday'),
        twitterLink: formData.get('twitterLink'),
    });
    
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update birthday. Please check the fields.',
        };
    }
    
    const { id, utaiteName, birthday, twitterLink } = validatedFields.data;

    if (!id) {
        return { message: 'Missing ID for update.' };
    }

    try {
        const collection = await getBirthdaysCollection();
        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { utaiteName, birthday, twitterLink } }
        );
    } catch (error) {
        console.error('Database Error (Update):', error);
        if (error instanceof AuthError) {
             return { message: error.message };
        }
        return { message: 'Database Error: Failed to update birthday.' };
    }
    
    revalidatePath('/');
    return { message: 'Successfully updated birthday.' };
}

export async function deleteBirthday(id: string): Promise<{ message: string }> {
    try {
        await checkAuth();
    } catch (error) {
        if (error instanceof AuthError) {
            return { message: error.message };
        }
        return { message: 'An unexpected authentication error occurred.' };
    }

    if (!id) {
        return { message: 'Missing ID for deletion.' };
    }

    try {
        const collection = await getBirthdaysCollection();
        await collection.deleteOne({ _id: new ObjectId(id) });
    } catch (error) {
        console.error('Database Error (Delete):', error);
        if (error instanceof AuthError) {
             return { message: error.message };
        }
        return { message: 'Database Error: Failed to delete birthday.' };
    }
    
    revalidatePath('/');
    return { message: 'Successfully deleted birthday.' };
}