import { verifyAuthWithStatus, clearSessionCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
    if (req.method === 'DELETE' || req.method === 'POST') {
        clearSessionCookie(req, res);
        return res.status(200).json({ message: 'Logged out' });
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { user, status, error } = await verifyAuthWithStatus(req, 'locus');
        if (!user) {
            return res.status(status || 401).json({
                isAuthenticated: status === 403,
                error: error || 'Authentication failed'
            });
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
