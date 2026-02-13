export interface Reply {
    id: string;
    text: string;
    time: string;
    date: string;
    author: string;
    type: 'agent' | 'client' | 'vendor';
    category: 'client' | 'vendor';
    to?: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    createdAt: string;
}

export interface Ticket {
    id: string;
    ticketId: string;
    header: string;
    email: string;
    status: string;
    priority: string;
    circuitId?: string;
    date: string; // Formatted date string
    receivedAt?: string; // ISO timestamp from email
    receivedTime?: string; // Display time (24-hour format HH:MM)
    replies: Reply[];
    createdAt: string;
    updatedAt: string;
    // Add other fields as needed
}

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/tickets`;

const getAuthHeaders = () => {
    const userStr = localStorage.getItem('edgestone_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}`
    };
};

export const ticketService = {
    getAllTickets: async (): Promise<Ticket[]> => {
        const response = await fetch(`${API_URL}`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Handle unauthorized (maybe redirect to logic, but for service just throw)
                throw new Error('Unauthorized');
            }
            const error = await response.json().catch(() => ({ message: 'Failed to fetch tickets' }));
            throw new Error(error.message);
        }

        return response.json();
    },

    replyToTicket: async (id: string, message: string): Promise<Reply> => {
        const response = await fetch(`${API_URL}/${id}/reply`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            const error = await response.json().catch(() => ({ message: 'Failed to send reply' }));
            throw new Error(error.message);
        }

        const result = await response.json();
        return result.reply;
    },

    updateTicketStatus: async (id: string, status: string): Promise<Ticket> => {
        const response = await fetch(`${API_URL}/${id}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            const error = await response.json().catch(() => ({ message: 'Failed to update ticket status' }));
            throw new Error(error.message);
        }

        return response.json();
    }
};
