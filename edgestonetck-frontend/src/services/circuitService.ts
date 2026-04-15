/** Circuit entity returned by GET /api/circuits */
export interface Circuit {
    id: string;
    customerCircuitId: string;
    supplierCircuitId: string | null;
    type: 'PROTECTED' | 'UNPROTECTED';
    vendorId: string | null;
    vendor: { id: string; name: string; status: string } | null;
    clientId: string | null;
    client: { id: string; name: string; status: string } | null;
    // Detail fields
    poNumber: string | null;
    serviceDescription: string | null;
    contractTermMonths: number | null;
    contractType: string | null;
    mrc: number;
    supplierPoNumber: string | null;
    supplierServiceDescription: string | null;
    supplierContractTermMonths: number | null;
    supplierContractType: string | null;
    billingStartDate: string | null;
    supplierMrc: number;
}

export interface CreateCircuitData {
    customerCircuitId: string;
    supplierCircuitId?: string | null;
    type?: 'PROTECTED' | 'UNPROTECTED';
    vendorId?: string | null;
    clientId?: string | null;
    poNumber?: string | null;
    serviceDescription?: string | null;
    contractTermMonths?: number | null;
    contractType?: string | null;
    mrc?: number;
    supplierPoNumber?: string | null;
    supplierServiceDescription?: string | null;
    supplierContractTermMonths?: number | null;
    supplierContractType?: string | null;
    billingStartDate?: string | null;
    supplierMrc?: number;
}

export type UpdateCircuitData = Partial<CreateCircuitData>;

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
        const response = await fetch(API_URL, { headers: getAuthHeaders() });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            const err = await response.json().catch(() => ({ message: 'Failed to fetch circuits' }));
            throw new Error(err.message);
        }
        const result = await response.json();
        return result.data ?? result;
    },

    createCircuit: async (data: CreateCircuitData): Promise<Circuit> => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            const err = await response.json().catch(() => ({ message: 'Failed to create circuit' }));
            throw new Error(err.message);
        }
        const result = await response.json();
        return result.data ?? result;
    },

    updateCircuit: async (id: string, data: UpdateCircuitData): Promise<Circuit> => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            const err = await response.json().catch(() => ({ message: 'Failed to update circuit' }));
            throw new Error(err.message);
        }
        const result = await response.json();
        return result.data ?? result;
    },
};
