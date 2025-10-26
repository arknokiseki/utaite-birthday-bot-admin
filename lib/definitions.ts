import { z } from 'zod';
import { ObjectId } from 'mongodb';

const birthdayValidation = z.string()
    .regex(/^(\d{4}-)?\d{2}-\d{2}$/, {
        message: "Date must be in YYYY-MM-DD or MM-DD format.",
    })
    .refine(dateStr => {
        const parts = dateStr.split('-');
        let year, month, day;

        if (parts.length === 3) {
            [year, month, day] = parts.map(Number);
        } else {
            year = 2000; 
            [month, day] = parts.map(Number);
        }

        const date = new Date(year, month - 1, day);

        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    }, {
        message: "Please enter a valid calendar date (e.g., month 1-12, day 1-31).",
    });


export const BirthdaySchema = z.object({
    id: z.string(),
    utaiteName: z.string().min(1, { message: "Name is required." }),
    birthday: birthdayValidation,
    twitterLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

export const CreateBirthdaySchema = BirthdaySchema.omit({ id: true });

export type Birthday = {
    _id: ObjectId;
    utaiteName: string;
    birthday: string;
    twitterLink?: string;
    createdAt: Date;
    };

export type FilterValues = {
    name: string;
    year: string;
    twitter: string;
    search: string;
    month: string;
    day: string;
}