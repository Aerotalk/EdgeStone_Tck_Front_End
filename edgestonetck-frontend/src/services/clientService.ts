export interface Client {
    id: string;
    name: string;
    createdOn: string;
    emails: string[];
    status: 'Active' | 'In-Active';
}

export interface CreateClientData {
    name: string;
    emails: string[];
    status?: 'Active' | 'In-Active';
}

export interface UpdateClientData {
    name?: string;
    emails?: string[];
    status?: 'Active' | 'In-Active';
}

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/clients`;

const getAuthHeaders = () => {
    const userStr = localStorage.getItem('edgestone_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}`
    };
};

const MOCK_CLIENTS: Client[] = [
    { id: 'c-001', name: 'Tata Communications', createdOn: '2025-01-01', emails: ['support@tata.com'], status: 'Active' },
    { id: 'c-002', name: 'Reliance Jio', createdOn: '2025-01-02', emails: ['support@jio.com'], status: 'Active' },
    { id: 'c-003', name: 'BSNL', createdOn: '2025-01-03', emails: ['support@bsnl.com'], status: 'Active' },
    { id: 'c-004', name: 'Wipro', createdOn: '2025-01-04', emails: ['support@wipro.com'], status: 'Active' },
    { id: 'c-005', name: 'Infosys', createdOn: '2025-01-05', emails: ['support@infosys.com'], status: 'Active' },
    { id: 'c-006', name: 'HCL Technologies', createdOn: '2025-01-06', emails: ['support@hcl.com'], status: 'Active' },
];

export const clientService = {
    getAllClients: async (): Promise<Client[]> => {
        console.log('🔵 Fetching all clients (DUMMY MODE)...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_CLIENTS;
    },

    createClient: async (data: CreateClientData): Promise<Client> => {
        console.log('🔵 Creating client:', data);
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        console.log('🔵 Create client response status:', response.status);
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            if (response.status === 404) {
                console.error('❌ 404 Error: Client API endpoint not found. Did you restart the backend server?');
                throw new Error('Client API not found - Please restart the backend server');
            }
            const error = await response.json().catch(() => ({ message: 'Failed to create client' }));
            console.error('❌ Create client error:', error);
            throw new Error(error.message);
        }
        const result = await response.json();
        console.log('✅ Client created successfully:', result);
        return result;
    },

    updateClient: async (id: string, data: UpdateClientData): Promise<Client> => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            const error = await response.json().catch(() => ({ message: 'Failed to update client' }));
            throw new Error(error.message);
        }
        return response.json();
    }
};
