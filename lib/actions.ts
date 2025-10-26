'use server';

import { revalidatePath } from 'next/cache';
import clientPromise from './mongodb';
import { BirthdaySchema, CreateBirthdaySchema } from './definitions';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { z } from 'zod';

type State = {
    success?: boolean;
    errors?: {
        id?: { errors: string[] };
        utaiteName?: { errors: string[] };
        birthday?: { errors: string[] };
        twitterLink?: { errors: string[] };
    };
    message: string;
};

type Birthday = {
    _id: ObjectId;
    utaiteName: string;
    birthday: string;
    twitterLink: string;
    createdAt: Date;
};

async function checkAuth(): Promise<void> {
    const authCookie = (await cookies()).get('auth');
    if (!authCookie || authCookie.value !== 'true') {
        throw new Error('Not authenticated.');
    }
}

const getBirthdaysCollection = async () => {
    await checkAuth(); 
    const client = await clientPromise;
    const db = client.db();
    return db.collection<Birthday>('birthdays');
};

export async function getBirthdays(): Promise<Birthday[]> {
    try {
        const collection = await getBirthdaysCollection();
        const birthdays = await collection.find({})
            .collation({ locale: 'en', strength: 2 })
            .sort({ utaiteName: 1 })
            .toArray();

        return JSON.parse(JSON.stringify(birthdays));
    } catch (error) {
        if (error instanceof Error) {
            console.error('getBirthdays failed:', error.message);
            if (error.message.includes('Not authenticated')) {
                throw new Error('Session expired or not authenticated.');
            }
        }
        throw new Error('Failed to fetch birthdays.');
    }
}

export async function createBirthday(
    _prevState: State, 
    formData: FormData
): Promise<State> {
    const validatedFields = CreateBirthdaySchema.safeParse({
        utaiteName: formData.get('utaiteName'),
        birthday: formData.get('birthday'),
        twitterLink: formData.get('twitterLink'),
    });

    if (!validatedFields.success) {
        const errorTree = z.treeifyError(validatedFields.error);
        console.error("Zod Validation Error:", errorTree);
        return {
            success: false,
            errors: errorTree.properties,
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
        } as Birthday);
        
        revalidatePath('/');
        return { 
            success: true,
            message: 'Successfully created birthday.' 
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('Not authenticated')) {
                return { 
                    success: false,
                    message: 'Error: Not authenticated.' 
                };
            }
        }
        return { 
            success: false,
            message: 'Database Error: Failed to create birthday.' 
        };
    }
}

export async function updateBirthday(
    _prevState: State, 
    formData: FormData
): Promise<State> {
    const validatedFields = BirthdaySchema.safeParse({
        id: formData.get('id'),
        utaiteName: formData.get('utaiteName'),
        birthday: formData.get('birthday'),
        twitterLink: formData.get('twitterLink'),
    });
    
    if (!validatedFields.success) {
        const errorTree = z.treeifyError(validatedFields.error);
        console.error("Zod Validation Error:", errorTree);
        return {
            success: false,
            errors: errorTree.properties,
            message: 'Failed to update birthday. Please check the fields.',
        };
    }
    
    const { id, utaiteName, birthday, twitterLink } = validatedFields.data;

    if (typeof id !== 'string' || id.length === 0) {
        return { 
            success: false,
            message: 'Missing or invalid ID for update.' 
        };
    }

    const dataToUpdate = {
        utaiteName,
        birthday,
        twitterLink,
    };

    try {
        const collection = await getBirthdaysCollection();
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: dataToUpdate }
        );
        
        if (result.matchedCount === 0) {
            return { 
                success: false,
                message: 'Birthday not found.' 
            };
        }
        
        revalidatePath('/');
        return { 
            success: true,
            message: 'Successfully updated birthday.' 
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('Not authenticated')) {
                return { 
                    success: false,
                    message: 'Error: Not authenticated.' 
                };
            }
        }
        return { 
            success: false,
            message: 'Database Error: Failed to update birthday.' 
        };
    }
}

export async function deleteBirthday(id: string): Promise<State> {
    if (!id) {
        return { 
            success: false,
            message: 'Missing ID for deletion.' 
        };
    }

    try {
        const collection = await getBirthdaysCollection();
        const result = await collection.deleteOne({ 
            _id: new ObjectId(id) 
        });
        
        if (result.deletedCount === 0) {
            return { 
                success: false,
                message: 'Birthday not found.' 
            };
        }
        
        revalidatePath('/');
        return { 
            success: true,
            message: 'Successfully deleted birthday.' 
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('Not authenticated')) {
                return { 
                    success: false,
                    message: 'Error: Not authenticated.' 
                };
            }
        }
        return { 
            success: false,
            message: 'Database Error: Failed to delete birthday.' 
        };
    }
}