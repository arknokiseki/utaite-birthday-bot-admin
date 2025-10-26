import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

if (!process.env.MONGODB_DB) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_DB"');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    const globalWithMongo = global as typeof global & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, {});
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    client = new MongoClient(uri, {});
    clientPromise = client.connect();
}

export { dbName };
export default clientPromise;
