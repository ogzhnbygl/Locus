import clientPromise from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    const client = await clientPromise;
    const db = client.db('Locus_db');
    const collection = db.collection('rooms');

    switch (req.method) {
        case 'GET':
            try {
                const rooms = await collection.find({}).sort({ createdAt: -1 }).toArray();
                const formatted = rooms.map(room => ({
                    ...room,
                    id: room._id.toString()
                }));
                res.status(200).json(formatted);
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'POST':
            try {
                const { name, description } = req.body;
                if (!name) return res.status(400).json({ error: 'Name is required' });

                const newRoom = {
                    name,
                    description: description || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const result = await collection.insertOne(newRoom);
                res.status(201).json({ ...newRoom, id: result.insertedId.toString() });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'PUT':
            try {
                const { id, name, description } = req.body;
                if (!id || !name) return res.status(400).json({ error: 'ID and Name are required' });

                const result = await collection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { name, description: description || '', updatedAt: new Date().toISOString() } }
                );

                if (result.matchedCount === 0) return res.status(404).json({ error: 'Room not found' });
                res.status(200).json({ success: true });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.query;
                if (!id) return res.status(400).json({ error: 'ID is required' });

                // Delete all racks in this room first (Cascading)
                await db.collection('racks').deleteMany({ roomId: id });

                await collection.deleteOne({ _id: new ObjectId(id) });
                res.status(200).json({ success: true });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
