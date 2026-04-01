export interface Vendor {
    id: string;
    name: string;
    createdOn: string;
    emails: string[];
    status: 'Active' | 'In-Active';
}

export interface CreateVendorData {
    name: string;
    emails: string[];
    status?: 'Active' | 'In-Active';
}

export interface UpdateVendorData {
    name?: string;
    emails?: string[];
    status?: 'Active' | 'In-Active';
}

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/vendors`;

const getAuthHeaders = () => {
    const userStr = localStorage.getItem('edgestone_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}`
    };
};

const MOCK_VENDORS: Vendor[] = [
    { id: 'v-001', name: 'Airtel', createdOn: '2025-01-01', emails: ['support@airtel.com'], status: 'Active' },
    { id: 'v-002', name: 'Vodafone', createdOn: '2025-01-02', emails: ['support@vodafone.com'], status: 'Active' },
    { id: 'v-003', name: 'Lumen Technologies', createdOn: '2025-01-03', emails: ['support@lumen.com'], status: 'Active' },
    { id: 'v-004', name: 'Telia Carrier', createdOn: '2025-01-04', emails: ['support@telia.com'], status: 'Active' },
];

export const vendorService = {
    getAllVendors: async (): Promise<Vendor[]> => {
        console.log('🔵 Fetching all vendors (DUMMY MODE)...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_VENDORS;
    },

    createVendor: async (data: CreateVendorData): Promise<Vendor> => {
        console.log('🔵 Creating vendor:', data);
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        console.log('🔵 Create vendor response status:', response.status);
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            if (response.status === 404) {
                console.error('❌ 404 Error: Vendor API endpoint not found. Did you restart the backend server?');
                throw new Error('Vendor API not found - Please restart the backend server');
            }
            const error = await response.json().catch(() => ({ message: 'Failed to create vendor' }));
            console.error('❌ Create vendor error:', error);
            throw new Error(error.message);
        }
        const result = await response.json();
        console.log('✅ Vendor created successfully:', result);
        return result;
    },

    updateVendor: async (id: string, data: UpdateVendorData): Promise<Vendor> => {
        console.log('🔵 Updating vendor:', id, data);
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        console.log('🔵 Update vendor response status:', response.status);
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            if (response.status === 404) {
                console.error('❌ 404 Error: Vendor API endpoint not found. Did you restart the backend server?');
                throw new Error('Vendor API not found - Please restart the backend server');
            }
            const error = await response.json().catch(() => ({ message: 'Failed to update vendor' }));
            console.error('❌ Update vendor error:', error);
            throw new Error(error.message);
        }
        const result = await response.json();
        console.log('✅ Vendor updated successfully:', result);
        return result;
    }
};
