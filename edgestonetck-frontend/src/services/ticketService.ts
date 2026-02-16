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

    updateTicket: async (id: string, data: Partial<Ticket>): Promise<Ticket> => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }

            // Gracefully handle missing update endpoint so the UI can still
            // move tickets between Open / In Progress / Closed using local state.
            // This avoids blocking the user with an error toast while still
            // attempting the network call for when the backend implements it.
            if (response.status === 404) {
                console.warn('Ticket API update endpoint not found. Falling back to local-only status update.');
                // Return a minimal Ticket-shaped object so callers that ignore
                // the response (current callers do) can proceed without errors.
                return {
                    ...(data as Ticket),
                    id,
                };
            }

            const error = await response.json().catch(() => ({ message: 'Failed to update ticket' }));
            throw new Error(error.message);
        }

        return response.json();
    }
};
