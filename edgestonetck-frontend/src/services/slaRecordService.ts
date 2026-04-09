const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/sla-records`;

const getAuthHeaders = () => {
    const userStr = localStorage.getItem('edgestone_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}`
    };
};

export interface SLARecord {
    id: string;
    ticketId: string;
    startDate: string;
    displayStartDate: string;
    startTime: string;
    closedTime: string;
    closeDate: string;
    status: 'Breached' | 'Safe';
    compensation: string;
    statusReason?: string;
}

export const slaRecordService = {
    getAllSLARecords: async (): Promise<SLARecord[]> => {
        try {
            const response = await fetch(API_URL, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Failed to fetch SLA records');
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching SLA records:', error);
            throw error;
        }
    },

    updateSLARecordStatus: async (id: string, status: 'Breached' | 'Safe', reason: string): Promise<SLARecord> => {
        try {
            const response = await fetch(`${API_URL}/${id}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status, reason })
            });
            if (!response.ok) throw new Error('Failed to update SLA record status');
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error updating SLA record status:', error);
            throw error;
        }
    }
};
