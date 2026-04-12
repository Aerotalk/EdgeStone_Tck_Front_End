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
            const response = await fetch(API_URL, { headers: getAuthHeaders() }).catch(() => ({ ok: false, json: async () => ({ data: [] }) }));
            const result = response.ok ? await (response as any).json() : { data: [] };
            
            const serverRecords: SLARecord[] = result.data || [];
            const mockedRecords: Partial<SLARecord>[] = JSON.parse(localStorage.getItem('mocked_sla_records') || '[]');

            const allRecords = [...serverRecords];
            for (const mock of mockedRecords) {
                const idx = allRecords.findIndex(r => r.id === mock.id || r.ticketId === mock.ticketId);
                if (idx === -1) {
                    if (mock.ticketId) {
                        allRecords.unshift(mock as SLARecord); // newly created mock
                    }
                } else {
                    allRecords[idx] = { ...allRecords[idx], ...mock }; // overlay updates
                }
            }
            return allRecords;
        } catch (error) {
            console.error('Error fetching SLA records:', error);
            // Fallback to purely mocked on hard fail
            return JSON.parse(localStorage.getItem('mocked_sla_records') || '[]').filter((r: any) => r.ticketId);
        }
    },

    getSLARecordByTicketId: async (ticketId: string): Promise<SLARecord | null> => {
        const mockedRecords: Partial<SLARecord>[] = JSON.parse(localStorage.getItem('mocked_sla_records') || '[]');
        const mock = mockedRecords.find(r => r.id === ticketId);
        
        try {
            const response = await fetch(`${API_URL}/ticket/${ticketId}`, { headers: getAuthHeaders() });
            if (!response.ok || response.status === 404) {
                return (mock as SLARecord) || null;
            }
            const result = await response.json();
            return { ...result.data, ...mock };
        } catch (error) {
            console.warn('Error fetching SLA record, using mock:', error);
            return (mock as SLARecord) || null;
        }
    },

    createSLARecord: async (id: string, ticketId: string, startDate: string, startTime: string): Promise<SLARecord> => {
        const mockRecord: SLARecord = {
            id, ticketId, startDate, displayStartDate: startDate, startTime,
            closeDate: '', closedTime: '', status: 'Safe', compensation: '-'
        };
        const mocked = JSON.parse(localStorage.getItem('mocked_sla_records') || '[]');
        if (!mocked.find((r: any) => r.id === id)) {
            mocked.push(mockRecord);
            localStorage.setItem('mocked_sla_records', JSON.stringify(mocked));
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, ticketId, startDate, startTime })
            });
            if (!response.ok) throw new Error('API failed gracefully');
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.warn('Backend unavailable, SLA Record stored locally.');
            return mockRecord; // Return mock on fail
        }
    },

    updateSLAClosure: async (ticketId: string, closeDate: string, closedTime: string): Promise<SLARecord> => {
        const mocked = JSON.parse(localStorage.getItem('mocked_sla_records') || '[]');
        const existing = mocked.find((r: any) => r.id === ticketId);
        if (existing) {
            existing.closeDate = closeDate;
            existing.closedTime = closedTime;
        } else {
            mocked.push({ id: ticketId, closeDate, closedTime });
        }
        localStorage.setItem('mocked_sla_records', JSON.stringify(mocked));
        
        try {
            const response = await fetch(`${API_URL}/ticket/${ticketId}/closure`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ closeDate, closedTime })
            });
            if (!response.ok) throw new Error('API failed');
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.warn('Backend update failed, mapped locally.');
            return { id: ticketId, closeDate, closedTime } as SLARecord;
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
