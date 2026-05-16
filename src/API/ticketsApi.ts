import api from './axiosInstance';

export interface TicketListItem {
    id: number;
    trackingCode: string;
    title: string;
    customerId: number;
    customerName: string;
    workerId: number | null;
    workerName: string | null;
    serviceType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    deviceType: string;
    brand: string;
    model: string;
    serialNumber: string;
    problemDescription: string;
}

export interface CreateTicketPayload {
    title: string;
    customerId: number;
    workerId: number;          // required
    serviceType: string;
    deviceType: string;
    brand: string;
    model: string;
    serialNumber: string;
    problemDescription: string;
}

export type UpdateTicketPayload = CreateTicketPayload;

export const fetchTickets = async (search?: string, status?: string): Promise<TicketListItem[]> => {
    const params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;
    const response = await api.get<TicketListItem[]>('/tickets', { params });
    return response.data;
};

export const createTicket = async (data: CreateTicketPayload): Promise<TicketListItem> => {
    const response = await api.post<TicketListItem>('/tickets', data);
    return response.data;
};

export const updateTicket = async (id: number, data: UpdateTicketPayload): Promise<TicketListItem> => {
    const response = await api.put<TicketListItem>(`/tickets/${id}`, data);
    return response.data;
};

export const updateTicketStatus = async (id: number, status: string) => {
    const response = await api.put(`/tickets/${id}/status`, { status });
    return response.data;
};

export const deleteTicket = async (id: number) => {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
};