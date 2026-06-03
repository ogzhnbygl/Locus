import { verifyAuth } from '../lib/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const user = await verifyAuth(req, 'locus');
        if (!user) {
            return res.status(401).json({ isAuthenticated: false, error: 'Authentication failed' });
        }

        return res.status(200).json({
            isAuthenticated: true,
            user: {
                email: user.email,
                name: user.name || user.email.split('@')[0],
                role: user.role,
                apps: user.apps || []
            }
        });

    } catch (error) {
        console.error('Session verification error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
