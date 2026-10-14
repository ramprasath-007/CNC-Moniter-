import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

function getAdminApp() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const databaseURL = process.env.FIREBASE_DATABASE_URL;

    if (!projectId || !clientEmail || !privateKey || !databaseURL) {
        throw new Error('Firebase Admin environment variables are missing.');
    }

    return getApps()[0] ?? initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey,
        }),
        databaseURL,
    });
}

export function getAdminDatabase() {
    return getDatabase(getAdminApp());
}