// API Client for MongoDB (via Vercel Serverless Functions)

export const db = {
    animals: {
        toArray: async () => {
            const response = await fetch('/api/animals');
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(error.error || 'Failed to fetch animals');
            }
            return await response.json();
        },

        add: async (record) => {
            const response = await fetch('/api/animals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(error.error || 'Failed to add animal');
            }
            return await response.json();
        },

        delete: async (id) => {
            const response = await fetch(`/api/animals?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(error.error || 'Failed to delete animal');
            }
            return await response.json();
        }
    }
};
