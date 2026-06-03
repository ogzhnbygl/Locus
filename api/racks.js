import clientPromise from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '../lib/auth.js';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const user = await verifyAuth(req, 'locus');
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

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
                    id: rack._id.toString(),
                    roomId: rack.roomId.toString()
                }));
                res.status(200).json(formatted);
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'POST':
            try {
                const { roomId, name, description, rows, cols } = req.body;
                if (!roomId || !name) return res.status(400).json({ error: 'roomId and name are required' });

                const newRack = {
                    roomId,
                    name,
                    description: description || '',
                    rows: rows ? parseInt(rows, 10) : 1,
                    cols: cols ? parseInt(cols, 10) : 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const result = await collection.insertOne(newRack);
                res.status(201).json({ ...newRack, id: result.insertedId.toString() });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'PUT':
            try {
                const { id, name, description, rows, cols } = req.body;
                if (!id || !name) return res.status(400).json({ error: 'ID and Name are required' });

                const updateData = {
                    name,
                    description: description || '',
                    updatedAt: new Date().toISOString()
                };
                if (rows) updateData.rows = parseInt(rows, 10);
                if (cols) updateData.cols = parseInt(cols, 10);

                const result = await collection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.matchedCount === 0) return res.status(404).json({ error: 'Rack not found' });
                res.status(200).json({ success: true });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.query;
                if (!id) return res.status(400).json({ error: 'ID is required' });

                // Deep Cascading Deletes: Delete all animals inside cages in this rack first
                const cages = await db.collection('cages').find({ rackId: id }).toArray();
                const cageIds = cages.map(c => c._id.toString());

                if (cageIds.length > 0) {
                    await db.collection('animals').deleteMany({ cageId: { $in: cageIds } });
                }

                // Delete all cages in this rack
                await db.collection('cages').deleteMany({ rackId: id });

                // Delete the rack
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
