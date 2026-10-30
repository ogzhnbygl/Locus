import clientPromise, { getDbName } from '../lib/mongodb.js';
import { verifyAuthWithStatus } from '../lib/auth.js';

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { user, status, error } = await verifyAuthWithStatus(req, 'locus');
    if (!user) {
        return res.status(status || 401).json({ error: error || 'Unauthorized' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (rawQuery.length < 2) {
        return res.status(200).json([]);
    }

    const safePattern = escapeRegExp(rawQuery);

    try {
        const client = await clientPromise;
        const db = client.db(getDbName('LabProject_db'));

        const projects = await db.collection('projects')
            .find({
                $or: [
                    { code: { $regex: safePattern, $options: 'i' } },
                    { title: { $regex: safePattern, $options: 'i' } }
                ]
            })
            .limit(10)
            .project({
                code: 1,
                title: 1,
                _id: 1
            })
            .toArray();

        res.status(200).json(projects);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
