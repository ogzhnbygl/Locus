import clientPromise from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    const client = await clientPromise;
    const db = client.db('Locus_db');
    const collection = db.collection('animals');

    switch (req.method) {
        case 'GET':
            try {
                const { cageId } = req.query;
                let query = {};
                if (cageId) {
                    query.cageId = cageId;
                }
                const animals = await collection.find(query).sort({ dob: -1 }).toArray();
                const formatted = animals.map(animal => ({
                    ...animal,
                    id: animal._id.toString()
                }));
                res.status(200).json(formatted);
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'POST':
            try {
                const { cageId, species, strain, sex, count, dob, projectCode } = req.body;

                if (!cageId || !species || !strain || !sex || !count || !dob) {
                    return res.status(400).json({ error: 'Required fields are missing' });
                }

                const newAnimalRecord = {
                    cageId,
                    species,
                    strain,
                    sex,
                    count: parseInt(count, 10),
                    dob,
                    projectCode: projectCode || '-',
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const result = await collection.insertOne(newAnimalRecord);
                res.status(201).json({ ...newAnimalRecord, id: result.insertedId.toString() });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.query;
                if (!id) return res.status(400).json({ error: 'ID is required' });

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
