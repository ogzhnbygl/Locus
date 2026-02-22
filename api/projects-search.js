import clientPromise from '../lib/mongodb.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.status(200).json([]);
    }

    try {
        const client = await clientPromise;
        // Connect specifically to LabProject_db
        const db = client.db('LabProject_db');

        const projects = await db.collection('projects')
            .find({
                $or: [
                    { code: { $regex: q, $options: 'i' } },
                    { title: { $regex: q, $options: 'i' } }
                ]
            })
            .limit(10)
            .project({
                code: 1,
                title: 1,
                _id: 1 // We might need ID for key, but code is main identifier
            })
            .toArray();

        res.status(200).json(projects);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
