import clientPromise from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    const client = await clientPromise;
    const db = client.db('Locus_db');
    const collection = db.collection('racks');

    switch (req.method) {
        case 'GET':
            try {
                const { roomId } = req.query;
                let query = {};
                if (roomId) {
                    query.roomId = roomId;
                }
                const racks = await collection.find(query).sort({ createdAt: -1 }).toArray();
                const formatted = racks.map(rack => ({
                    ...rack,
                    id: rack._id.toString()
                }));
                res.status(200).json(formatted);
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'POST':
            try {
                const { roomId, name, description, rows, cols, sides } = req.body;
                if (!roomId || !name) return res.status(400).json({ error: 'roomId and name are required' });

                const newRack = {
                    roomId,
                    name,
                    description: description || '',
                    rows: rows ? parseInt(rows, 10) : 1,
                    cols: cols ? parseInt(cols, 10) : 1,
                    sides: sides ? parseInt(sides, 10) : 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const result = await collection.insertOne(newRack);
                res.status(201).json({ ...newRack, id: result.insertedId.toString() });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.query;
                if (!id) return res.status(400).json({ error: 'ID is required' });

                // Delete all cages in this rack
                await db.collection('cages').deleteMany({ rackId: id });

                await collection.deleteOne({ _id: new ObjectId(id) });
                res.status(200).json({ success: true });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
