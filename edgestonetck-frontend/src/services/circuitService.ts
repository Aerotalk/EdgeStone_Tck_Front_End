export interface Circuit {
    id: string;
    circuitId: string;           // e.g. "BA/SNG-TY2/ESPL-003"
    type: 'Protected' | 'Unprotected';
    vendorId: string;
    vendorName: string;
    customerIds: string[];
    customerNames: string[];
}

// const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/circuits`;

// const getAuthHeaders = () => {
//     const userStr = localStorage.getItem('edgestone_user');
//     const user = userStr ? JSON.parse(userStr) : null;
//     return {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${user?.token || ''}`
//     };
// };

// ── Mock data for testing (remove when backend is ready) ──
const MOCK_CIRCUITS: Circuit[] = [
    {
        id: 'ckt-001',
        circuitId: 'BA/SNG-TY2/ESPL-003',
        type: 'Protected',
        vendorId: 'v-001',
        vendorName: 'Airtel',
        customerIds: ['c-001', 'c-002'],
        customerNames: ['Tata Communications', 'Reliance Jio'],
    },
    {
        id: 'ckt-002',
        circuitId: 'MU/DEL-BLR/ESPL-017',
        type: 'Unprotected',
        vendorId: 'v-002',
        vendorName: 'Vodafone',
        customerIds: ['c-003'],
        customerNames: ['BSNL'],
    },
    {
        id: 'ckt-003',
        circuitId: 'CH/HYD-PUN/ESPL-042',
        type: 'Protected',
        vendorId: 'v-001',
        vendorName: 'Airtel',
        customerIds: ['c-001', 'c-004'],
        customerNames: ['Tata Communications', 'Wipro'],
    },
    {
        id: 'ckt-004',
        circuitId: 'KO/CCU-MAA/ESPL-089',
        type: 'Unprotected',
        vendorId: 'v-003',
        vendorName: 'Lumen Technologies',
        customerIds: ['c-002', 'c-005'],
        customerNames: ['Reliance Jio', 'Infosys'],
    },
    {
        id: 'ckt-005',
        circuitId: 'DL/GGN-NDA/ESPL-112',
        type: 'Protected',
        vendorId: 'v-004',
        vendorName: 'Telia Carrier',
        customerIds: ['c-006'],
        customerNames: ['HCL Technologies'],
    },
];

export const circuitService = {
    getAllCircuits: async (): Promise<Circuit[]> => {
        console.log('🔵 Fetching all circuits (DUMMY MODE)...');
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_CIRCUITS;
    }
};
