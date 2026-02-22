import clientPromise from '../lib/mongodb.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const client = await clientPromise;
        const db = client.db('Dispo_db');
        const collection = db.collection('animals');

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        // Calculate start of year and start of month
        // The database stores dates as "YYYY-MM-DD" strings (from HTML date input)
        // So we should compare with strings in that format.

        const pad = (n) => n.toString().padStart(2, '0');

        const startOfYear = `${currentYear}-01-01`;
        const startOfMonth = `${currentYear}-${pad(currentMonth + 1)}-01`;

        // Aggregation pipeline
        const stats = await collection.aggregate([
            {
                $facet: {
                    "yearCount": [
                        {
                            $match: {
                                removalDate: { $gte: startOfYear }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: "$count" }
                            }
                        }
                    ],
                    "monthCount": [
                        {
                            $match: {
                                removalDate: { $gte: startOfMonth }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: "$count" }
                            }
                        }
                    ],
                    "projectTerminationCount": [
                        {
                            $match: {
                                reason: "EXP-01"
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: "$count" }
                            }
                        }
                    ],
                    "monthlyData": [
                        {
                            $match: {
                                removalDate: { $gte: startOfYear }
                            }
                        },
                        {
                            $project: {
                                month: { $substr: ["$removalDate", 5, 2] }, // Extract month "MM"
                                reason: 1,
                                count: 1
                            }
                        },
                        {
                            $group: {
                                _id: { month: "$month", reason: "$reason" },
                                count: { $sum: "$count" }
                            }
                        },
                        {
                            $group: {
                                _id: "$_id.month",
                                reasons: {
                                    $push: {
                                        k: "$_id.reason",
                                        v: "$count"
                                    }
                                },
                                total: { $sum: "$count" }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                month: "$_id",
                                total: 1,
                                reasons: { $arrayToObject: "$reasons" }
                            }
                        },
                        { $sort: { month: 1 } }
                    ]
                }
            }
        ]).toArray();

        const result = stats[0];

        // Format monthly data to ensure all 12 months are present
        const monthlyData = [];
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

        months.forEach(m => {
            const found = result.monthlyData.find(d => d.month === m);
            if (found) {
                monthlyData.push(found);
            } else {
                monthlyData.push({ month: m, total: 0, reasons: {} });
            }
        });

        res.status(200).json({
            year: result.yearCount[0]?.count || 0,
            month: result.monthCount[0]?.count || 0,
            projectTermination: result.projectTerminationCount[0]?.count || 0,
            monthlyData
        });

    } catch (e) {
        console.error("Dashboard stats error:", e);
        res.status(500).json({ error: e.message });
    }
}
