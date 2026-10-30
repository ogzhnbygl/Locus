import clientPromise, { getDbName } from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { verifyAuthWithStatus } from '../lib/auth.js';
import { z } from 'zod';

const rackPostSchema = z.object({
    roomId: z.string().refine(val => ObjectId.isValid(val), 'Geçersiz oda ID formatı.'),
    name: z.string().trim().min(1, 'Raf adı gereklidir.'),
    description: z.string().optional().default(''),
    rows: z.coerce.number().int().min(1, 'Satır sayısı en az 1 olmalıdır.').max(26, 'Satır sayısı en fazla 26 olabilir.').optional().default(1),
    cols: z.coerce.number().int().min(1, 'Sütun sayısı en az 1 olmalıdır.').max(50, 'Sütun sayısı en fazla 50 olabilir.').optional().default(1)
});

const rackPutSchema = z.object({
    id: z.string().refine(val => ObjectId.isValid(val), 'Geçersiz raf ID formatı.'),
    name: z.string().trim().min(1, 'Raf adı gereklidir.'),
    description: z.string().optional().default(''),
    rows: z.coerce.number().int().min(1).max(26).optional(),
    cols: z.coerce.number().int().min(1).max(50).optional()
});

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { user, status, error } = await verifyAuthWithStatus(req, 'locus');
    if (!user) {
        return res.status(status || 401).json({ error: error || 'Unauthorized' });
    }

    // Mutating operations on physical racks are restricted to administrators
    if (req.method !== 'GET' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Raf ekleme, düzenleme ve silme işlemleri sadece yöneticiler (Admin) tarafından yapılabilir.' });
    }

    const client = await clientPromise;
    const db = client.db(getDbName('Locus_db'));
    const collection = db.collection('racks');

    switch (req.method) {
        case 'GET':
            try {
                const { roomId } = req.query;
                const query = {};
                if (typeof roomId === 'string' && roomId) {
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
                const validation = rackPostSchema.safeParse(req.body);
                if (!validation.success) {
                    return res.status(400).json({
                        error: validation.error.issues?.[0]?.message || 'Geçersiz raf verisi.'
                    });
                }
                const { roomId, name, description, rows, cols } = validation.data;

                const newRack = {
                    roomId,
                    name,
                    description,
                    rows,
                    cols,
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
                const validation = rackPutSchema.safeParse(req.body);
                if (!validation.success) {
                    return res.status(400).json({
                        error: validation.error.issues?.[0]?.message || 'Geçersiz raf verisi.'
                    });
                }
                const { id, name, description, rows, cols } = validation.data;

                const existingRack = await collection.findOne({ _id: new ObjectId(id) });
                if (!existingRack) return res.status(404).json({ error: 'Raf bulunamadı.' });

                const nextRows = rows ?? existingRack.rows;
                const nextCols = cols ?? existingRack.cols;

                // Prevent orphaning cages outside new grid boundaries when shrinking a rack
                const outOfBoundsCage = await db.collection('cages').findOne({
                    rackId: id,
                    $or: [
                        { row: { $gt: nextRows } },
                        { column: { $gt: nextCols } }
                    ]
                });
                if (outOfBoundsCage) {
                    return res.status(400).json({
                        error: `Raf boyutu küçültülemez: (${outOfBoundsCage.row}. satır, ${outOfBoundsCage.column}. sütun) konumunda '${outOfBoundsCage.name}' kafesi bulunuyor.`
                    });
                }

                const updateData = {
                    name,
                    description,
                    rows: nextRows,
                    cols: nextCols,
                    updatedAt: new Date().toISOString()
                };

                await collection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                res.status(200).json({ success: true });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.query;
                if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
                    return res.status(400).json({ error: 'Geçerli bir raf ID gereklidir.' });
                }

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
