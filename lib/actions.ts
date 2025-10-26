import { unstable_cache, revalidateTag } from 'next/cache';
import { MongoClient, ObjectId } from 'mongodb';
import { z, ZodError } from 'zod';

import { Birthday, BirthdaySchema } from '@/lib/definitions';

type ActionState = {
  success?: boolean;
  message: string;
  errors?: {
    id?: string[];
    utaiteName?: string[];
    birthday?: string[];
    twitterLink?: string[];
  };
};

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'utaite-bot';
const BIRTHDAYS_COLLECTION = 'birthdays';

if (!MONGODB_URI) {
  // eslint-disable-next-line no-console
  console.warn(
    'MONGODB_URI is not set. Please configure it in your environment for /lib/actions.ts'
  );
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;
if (!global.__mongoClientPromise) {
  const client = new MongoClient(MONGODB_URI);
  global.__mongoClientPromise = client.connect();
}
clientPromise = global.__mongoClientPromise;

async function getCollection() {
  const client = await clientPromise;
  const db = client.db(MONGODB_DB);
  return db.collection(BirthdayCollectionName());
}

function BirthdayCollectionName() {
  return BIRTHDAYS_COLLECTION;
}

type BirthdayDoc = {
  _id: ObjectId;
  utaiteName: string;
  birthday: string;
  twitterLink?: string | null;
};

function serializeBirthday(doc: BirthdayDoc): Birthday {
  return {
    _id: doc._id.toString() as unknown as Birthday['_id'],
    utaiteName: doc.utaiteName,
    birthday: doc.birthday,
    twitterLink: doc.twitterLink ?? '',
  } as Birthday;
}

function toActionErrors(err: ZodError): ActionState['errors'] {
  const fieldErrors = err.flatten().fieldErrors as {
    id?: string[];
    utaiteName?: string[];
    birthday?: string[];
    twitterLink?: string[];
  };
  
  return {
    id: fieldErrors.id,
    utaiteName: fieldErrors.utaiteName,
    birthday: fieldErrors.birthday,
    twitterLink: fieldErrors.twitterLink,
  };
}

function sanitizeTwitterLink(link: string | null | undefined) {
  const v = (link ?? '').trim();
  if (!v) return '';
  return v.replace('https://x.com/', 'https://twitter.com/');
}

const getBirthdaysCached = unstable_cache(
  async (): Promise<Birthday[]> => {
    const col = await getCollection();
    const docs = (await col
      .find({})
      .sort({ utaiteName: 1 })
      .toArray()) as unknown as BirthdayDoc[];

    return docs.map(serializeBirthday);
  },
  ['birthdays'],
  { revalidate: 60, tags: ['birthdays'] }
);

export async function getBirthdays(): Promise<Birthday[]> {
  'use server';
  try {
    return await getBirthdaysCached();
  } catch (err) {
    throw err;
  }
}

export async function createBirthday(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  'use server';

  try {
    const payload = {
      utaiteName: (formData.get('utaiteName') as string | null) ?? '',
      birthday: (formData.get('birthday') as string | null) ?? '',
      twitterLink: (formData.get('twitterLink') as string | null) ?? '',
    };

    const parsed = BirthdaySchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation error',
        errors: toActionErrors(parsed.error),
      };
    }

    const col = await getCollection();
    const doc: Omit<BirthdayDoc, '_id'> = {
      utaiteName: parsed.data.utaiteName.trim(),
      birthday: parsed.data.birthday.trim(),
      twitterLink: sanitizeTwitterLink(parsed.data.twitterLink),
    };

    await col.insertOne(doc as any);

    revalidateTag('birthdays');

    return {
      success: true,
      message: `Success: Created birthday for ${doc.utaiteName}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error: ${err?.message ?? 'Failed to create birthday'}`,
    };
  }
}

export async function updateBirthday(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  'use server';

  try {
    const payload = {
      id: (formData.get('id') as string | null) ?? '',
      utaiteName: (formData.get('utaiteName') as string | null) ?? '',
      birthday: (formData.get('birthday') as string | null) ?? '',
      twitterLink: (formData.get('twitterLink') as string | null) ?? '',
    };

    const parsed = BirthdaySchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation error',
        errors: toActionErrors(parsed.error),
      };
    }

    if (!payload.id || !ObjectId.isValid(payload.id)) {
      return {
        success: false,
        message: 'Validation error',
        errors: { id: ['Invalid or missing id.'] },
      };
    }

    const col = await getCollection();
    const _id = new ObjectId(payload.id);

    const update = {
      $set: {
        utaiteName: parsed.data.utaiteName.trim(),
        birthday: parsed.data.birthday.trim(),
        twitterLink: sanitizeTwitterLink(parsed.data.twitterLink),
      },
    };

    const res = await col.updateOne({ _id }, update);

    if (res.matchedCount === 0) {
      return { success: false, message: 'Error: Birthday not found.' };
    }

    revalidateTag('birthdays');

    return {
      success: true,
      message: 'Success: Updated birthday',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error: ${err?.message ?? 'Failed to update birthday'}`,
    };
  }
}

export async function deleteBirthday(id: string): Promise<ActionState> {
  'use server';

  try {
    if (!id || !ObjectId.isValid(id)) {
      return {
        success: false,
        message: 'Error: Invalid id.',
        errors: { id: ['Invalid id.'] },
      };
    }

    const col = await getCollection();
    const _id = new ObjectId(id);
    const res = await col.deleteOne({ _id });

    if (res.deletedCount === 0) {
      return { success: false, message: 'Error: Birthday not found.' };
    }

    revalidateTag('birthdays');

    return { success: true, message: 'Success: Deleted birthday' };
  } catch (err: any) {
    return {
      success: false,
      message: `Error: ${err?.message ?? 'Failed to delete birthday'}`,
    };
  }
}