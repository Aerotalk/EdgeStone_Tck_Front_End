export interface Circuit {
    id: string;
    circuitId: string;           // e.g. "BA/SNG-TY2/ESPL-003"
    type: 'Protected' | 'Unprotected';
    vendorId: string;
    vendorName: string;
    customerIds: string[];
    customerNames: string[];
}

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/circuits`;

const getAuthHeaders = () => {
    const userStr = localStorage.getItem('edgestone_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}`
    };
};

export const circuitService = {
    getAllCircuits: async (): Promise<Circuit[]> => {
        console.log('🔵 Fetching all circuits...');
        const response = await fetch(`${API_URL}`, {
            headers: getAuthHeaders(),
        });
        console.log('🔵 Fetch circuits response status:', response.status);
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            if (response.status === 404) {
                console.error('❌ 404 Error: Circuit API endpoint not found.');
                throw new Error('Circuit API not found - Please restart the backend server');
            }
            const error = await response.json().catch(() => ({ message: 'Failed to fetch circuits' }));
            console.error('❌ Fetch circuits error:', error);
            throw new Error(error.message);
        }
        const result = await response.json();
        console.log(`✅ Successfully fetched ${result.length} circuits`);
        return result;
    }
};
