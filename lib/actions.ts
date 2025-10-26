'use server';

import { revalidatePath } from 'next/cache';
import clientPromise from './mongodb';
import { BirthdaySchema, CreateBirthdaySchema } from './definitions';
import { ObjectId } from 'mongodb';

type State = {
    errors?: {
        id?: string[];
        utaiteName?: string[];
        birthday?: string[];
        twitterLink?: string[];
    };
    message: string;
};

const getBirthdaysCollection = async () => {
    const client = await clientPromise;
    const db = client.db();
    return db.collection('birthdays');
};

export async function getBirthdays() {
    const collection = await getBirthdaysCollection();
    const birthdays = await collection.find({})
        .collation({ locale: 'en', strength: 2 })
        .sort({ utaiteName: 1 })
        .toArray();

    return JSON.parse(JSON.stringify(birthdays));
}

export async function createBirthday(prevState: State, formData: FormData) {
    const validatedFields = CreateBirthdaySchema.safeParse({
        utaiteName: formData.get('utaiteName'),
        birthday: formData.get('birthday'),
        twitterLink: formData.get('twitterLink'),
    });

    if (!validatedFields.success) {
        console.error("Zod Validation Error:", validatedFields.error.flatten());
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
    } catch {
        return { message: 'Database Error: Failed to create birthday.' };
    }

    revalidatePath('/');
    return { message: 'Successfully created birthday.' };
}

export async function updateBirthday(prevState: State, formData: FormData) {
    const validatedFields = BirthdaySchema.safeParse({
        id: formData.get('id'),
        utaiteName: formData.get('utaiteName'),
        birthday: formData.get('birthday'),
        twitterLink: formData.get('twitterLink'),
    });
    
    if (!validatedFields.success) {
        console.error("Zod Validation Error:", validatedFields.error.flatten());
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update birthday. Please check the fields.',
        };
    }
    
    const { id, utaiteName, birthday, twitterLink } = validatedFields.data;

    if (typeof id !== 'string' || id.length === 0) {
        return { message: 'Missing or invalid ID for update.' };
    }

    const dataToUpdate = {
        utaiteName,
        birthday,
        twitterLink,
    };

    try {
        const collection = await getBirthdaysCollection();
        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: dataToUpdate }
        );
    } catch {
        return { message: 'Database Error: Failed to update birthday.' };
    }
    
    revalidatePath('/');
    return { message: 'Successfully updated birthday.' };
}

export async function deleteBirthday(id: string) {
    if (!id) return { message: 'Missing ID for deletion.' };

    try {
        const collection = await getBirthdaysCollection();
        await collection.deleteOne({ _id: new ObjectId(id) });
    } catch {
        return { message: 'Database Error: Failed to delete birthday.' };
    }
    
    revalidatePath('/');
    return { message: 'Successfully deleted birthday.' };
}