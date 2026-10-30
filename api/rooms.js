import clientPromise, { getDbName } from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { verifyAuthWithStatus } from '../lib/auth.js';
import { z } from 'zod';

const roomPostSchema = z.object({
    name: z.string().trim().min(1, 'Oda adı gereklidir.'),
    description: z.string().optional().default('')
});

const roomPutSchema = z.object({
    id: z.string().refine(val => ObjectId.isValid(val), 'Geçersiz oda ID formatı.'),
    name: z.string().trim().min(1, 'Oda adı gereklidir.'),
    description: z.string().optional().default('')
});

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { user, status, error } = await verifyAuthWithStatus(req, 'locus');
    if (!user) {
        return res.status(status || 401).json({ error: error || 'Unauthorized' });
    }

    // Mutating operations on physical rooms are restricted to administrators
    if (req.method !== 'GET' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Oda ekleme, düzenleme ve silme işlemleri sadece yöneticiler (Admin) tarafından yapılabilir.' });
    }

    const client = await clientPromise;
    const db = client.db(getDbName('Locus_db'));
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
                const validation = roomPostSchema.safeParse(req.body);
                if (!validation.success) {
                    return res.status(400).json({
                        error: validation.error.issues?.[0]?.message || 'Geçersiz oda verisi.'
                    });
                }
                const { name, description } = validation.data;

                const newRoom = {
                    name,
                    description,
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
                const validation = roomPutSchema.safeParse(req.body);
                if (!validation.success) {
                    return res.status(400).json({
                        error: validation.error.issues?.[0]?.message || 'Geçersiz oda verisi.'
                    });
                }
                const { id, name, description } = validation.data;

                const result = await collection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { name, description, updatedAt: new Date().toISOString() } }
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
                if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
                    return res.status(400).json({ error: 'Geçerli bir oda ID gereklidir.' });
                }

                // Deep Cascading Deletes: Delete all animals, cages, and racks associated with this room.
                const racks = await db.collection('racks').find({ roomId: id }).toArray();
                const rackIds = racks.map(r => r._id.toString());

                const cages = await db.collection('cages').find({ rackId: { $in: rackIds } }).toArray();
                const cageIds = cages.map(c => c._id.toString());

                // 1. Delete animals in these cages
                if (cageIds.length > 0) {
                    await db.collection('animals').deleteMany({ cageId: { $in: cageIds } });
                }

                // 2. Delete cages in these racks
                if (rackIds.length > 0) {
                    await db.collection('cages').deleteMany({ rackId: { $in: rackIds } });
                }

                // 3. Delete racks in this room
                await db.collection('racks').deleteMany({ roomId: id });

                // 4. Delete the room itself
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
