import api from './axiosInstance';

export interface CustomerRequestListItem {
    id: number;
    customerId: number;
    customerName: string | null;
    title: string;
    ticketId: number | null;
    ticketTrackingCode: string | null;
    message: string;
    answer: boolean | null;
    answeredAt: string | null;
    createdBy: string;
    createdAt: string;
}

export interface CreateCustomerRequestPayload {
    customerId: number;
    title: string;
    ticketId?: number | null;
    message: string;
}

export type UpdateCustomerRequestPayload = CreateCustomerRequestPayload;

export const fetchCustomerRequests = async (customerId?: number): Promise<CustomerRequestListItem[]> => {
    const params: any = {};
    if (customerId) params.customerId = customerId;
    const response = await api.get<CustomerRequestListItem[]>('/customer-requests', { params });
    return response.data;
};

export const createCustomerRequest = async (data: CreateCustomerRequestPayload): Promise<CustomerRequestListItem> => {
    const response = await api.post<CustomerRequestListItem>('/customer-requests', data);
    return response.data;
};

export const updateCustomerRequest = async (id: number, data: UpdateCustomerRequestPayload): Promise<CustomerRequestListItem> => {
    const response = await api.put<CustomerRequestListItem>(`/customer-requests/${id}`, data);
    return response.data;
};

export const deleteCustomerRequest = async (id: number) => {
    const response = await api.delete(`/customer-requests/${id}`);
    return response.data;
};