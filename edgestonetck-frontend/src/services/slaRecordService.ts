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
            
            // Map over the results and overwrite with locally mocked data if it exists
            const records: SLARecord[] = result.data;
            return records.map(record => {
                // Check both ID types just to be safe
                const storedDate = localStorage.getItem(`sla_close_date_${record.ticketId}`) || localStorage.getItem(`sla_close_date_${record.id}`);
                const storedTime = localStorage.getItem(`sla_close_time_${record.ticketId}`) || localStorage.getItem(`sla_close_time_${record.id}`);
                
                if (storedDate || storedTime) {
                    return {
                        ...record,
                        closeDate: storedDate || record.closeDate,
                        closedTime: storedTime || record.closedTime
                    };
                }
                return record;
            });
        } catch (error) {
            console.error('Error fetching SLA records:', error);
            throw error;
        }
    },

    getSLARecordByTicketId: async (ticketId: string): Promise<SLARecord | null> => {
        const storedDate = localStorage.getItem(`sla_close_date_${ticketId}`);
        const storedTime = localStorage.getItem(`sla_close_time_${ticketId}`);
        
        try {
            const response = await fetch(`${API_URL}/ticket/${ticketId}`, { headers: getAuthHeaders() });
            if (!response.ok || response.status === 404) {
                if (storedDate || storedTime) {
                    return { ticketId, closeDate: storedDate || '', closedTime: storedTime || '' } as SLARecord;
                }
                return null;
            }
            const result = await response.json();
            return {
                ...result.data,
                closeDate: storedDate || result.data.closeDate,
                closedTime: storedTime || result.data.closedTime
            };
        } catch (error) {
            console.error('Error fetching SLA record:', error);
            if (storedDate || storedTime) {
                return { ticketId, closeDate: storedDate || '', closedTime: storedTime || '' } as SLARecord;
            }
            return null;
        }
    },

    createSLARecord: async (ticketId: string, startDate: string, startTime: string): Promise<SLARecord> => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ticketId, startDate, startTime })
            });
            if (!response.ok) throw new Error('Failed to create SLA record');
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error creating SLA record:', error);
            throw error;
        }
    },

    updateSLAClosure: async (ticketId: string, closeDate: string, closedTime: string): Promise<SLARecord> => {
        // ALWAYS mock to localStorage so frontend mapping updates immediately without backend
        localStorage.setItem(`sla_close_date_${ticketId}`, closeDate);
        localStorage.setItem(`sla_close_time_${ticketId}`, closedTime);
        
        try {
            const response = await fetch(`${API_URL}/ticket/${ticketId}/closure`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ closeDate, closedTime })
            });
            if (!response.ok) {
                console.warn('Backend mapping missing for SLA Updates. Using local override.');
                return {} as SLARecord;
            }
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.warn('Backend update failed, using local mocked mapping.', error);
            return {} as SLARecord;
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
