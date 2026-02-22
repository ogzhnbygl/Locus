import clientPromise from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const sessionId = req.cookies?.interapp_session || req.headers.authorization?.split(' ')[1];

        if (!sessionId) {
            return res.status(401).json({ isAuthenticated: false });
        }

        const client = await clientPromise;
        const db = client.db('Apex_db'); // Auth is always checked against Apex Hub DB

        const session = await db.collection('sessions').findOne({
            sessionId: sessionId
        });

        if (!session) {
            return res.status(401).json({ isAuthenticated: false });
        }

        // Optional: check if session is expired based on createdAt/expiresAt

        const user = await db.collection('users').findOne({
            _id: new ObjectId(session.userId)
        });

        if (!user) {
            return res.status(401).json({ isAuthenticated: false });
        }

        // Optional: Check if user has locus permission
        // if (user.role !== 'admin' && !user.apps?.includes('locus')) {
        //   return res.status(403).json({ isAuthenticated: true, isAuthorized: false, message: 'No access to Locus' });
        // }

        return res.status(200).json({
            isAuthenticated: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                apps: user.apps || []
            }
        });

    } catch (error) {
        console.error('Session verification error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
