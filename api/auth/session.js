import clientPromise from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const cookieHeader = req.headers.cookie || '';

        const apexResponse = await fetch('https://wildtype.app/api/auth/me', {
            method: 'GET',
            headers: {
                'Cookie': cookieHeader,
                'Content-Type': 'application/json'
            }
        });

        if (!apexResponse.ok) {
            return res.status(apexResponse.status).json({ isAuthenticated: false, error: 'Authentication failed' });
        }

        const userData = await apexResponse.json();
        const userEmail = userData.email;

        // Verify Authorization with Database (Apex_db)
        const client = await clientPromise;
        const db = client.db('Apex_db');
        const user = await db.collection('users').findOne({ email: userEmail });

        if (!user) {
            console.error(`User not found in Apex_db for email: ${userEmail}`);
            return res.status(401).json({ isAuthenticated: false, error: 'User not found in database.' });
        }

        // Check Permissions
        const isAdmin = user.role === 'admin';
        const hasLocusAccess = Array.isArray(user.apps) && user.apps.some(app => app.toLowerCase() === 'locus');

        if (!isAdmin && !hasLocusAccess) {
            console.warn(`Locus access denied for ${userEmail}.`);
            return res.status(401).json({ isAuthenticated: false, message: 'No access to Locus' });
        }

        return res.status(200).json({
            isAuthenticated: true,
            user: {
                ...userData,
                id: user._id.toString(),
                name: user.name || userEmail.split('@')[0],
                role: user.role,
                apps: user.apps || []
            }
        });

    } catch (error) {
        console.error('Session verification error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
