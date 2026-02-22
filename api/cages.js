import clientPromise from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    const client = await clientPromise;
    const db = client.db('Locus_db');
    const collection = db.collection('cages');

    switch (req.method) {
        case 'GET':
            try {
                const { rackId } = req.query;
                let query = {};
                if (rackId) {
                    query.rackId = rackId;
                }
                const cages = await collection.find(query).sort({ createdAt: -1 }).toArray();
                const formatted = cages.map(cage => ({
                    ...cage,
                    id: cage._id.toString()
                }));
                res.status(200).json(formatted);
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'POST':
            try {
                const { rackId, name, barcode, status, side, row, column } = req.body;
                if (!rackId || !name) return res.status(400).json({ error: 'rackId and name are required' });

                const newCage = {
                    rackId,
                    name,
                    barcode: barcode || '',
                    status: status || 'Active', // 'Active', 'Empty', 'Maintenance' etc.
                    side: side || 'A', // Default to single sided 'A'
                    row: row ? parseInt(row, 10) : 1,
                    column: column ? parseInt(column, 10) : 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const result = await collection.insertOne(newCage);
                res.status(201).json({ ...newCage, id: result.insertedId.toString() });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.query;
                if (!id) return res.status(400).json({ error: 'ID is required' });

                // Ensure no animals are in the cage before deleting, or delete them
                await db.collection('animals').deleteMany({ cageId: id });

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
