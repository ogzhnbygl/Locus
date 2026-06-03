import clientPromise from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '../lib/auth.js';
import { z } from 'zod';

const cagePostSchema = z.object({
    rackId: z.string().refine(val => {
        try {
            return ObjectId.isValid(val);
        } catch {
            return false;
        }
    }, 'Geçersiz rackId formatı.'),
    name: z.string().min(1, 'Kafes adı gereklidir.'),
    barcode: z.string().optional().default(''),
    status: z.string().optional().default('Active'),
    row: z.coerce.number().int().positive('Satır koordinatı pozitif bir tam sayı olmalıdır.'),
    column: z.coerce.number().int().positive('Sütun koordinatı pozitif bir tam sayı olmalıdır.')
});

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
                    id: cage._id.toString(),
                    rackId: cage.rackId.toString()
                }));
                res.status(200).json(formatted);
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'POST':
            try {
                const validation = cagePostSchema.safeParse(req.body);
                if (!validation.success) {
                    return res.status(400).json({ error: validation.error.errors[0].message });
                }
                const { rackId, name, barcode, status, row, column } = validation.data;

                // 1. Check if rack exists and retrieve dimensions
                const rack = await db.collection('racks').findOne({ _id: new ObjectId(rackId) });
                if (!rack) {
                    return res.status(404).json({ error: 'Belirtilen raf bulunamadı.' });
                }

                // 2. Coordinate boundaries check
                if (row > rack.rows || column > rack.cols) {
                    return res.status(400).json({
                        error: `Koordinatlar raf sınırları dışındadır. Raf boyutları: ${rack.rows} satır x ${rack.cols} sütun.`
                    });
                }

                // 3. Slot overlap check
                const existingCage = await collection.findOne({ rackId, row, column });
                if (existingCage) {
                    return res.status(400).json({
                        error: `Belirtilen konumda (${row}. satır, ${column}. sütun) zaten '${existingCage.name}' isimli bir kafes mevcut.`
                    });
                }

                const newCage = {
                    rackId,
                    name,
                    barcode,
                    status,
                    row,
                    column,
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
