import api from './axiosInstance';

export interface CustomerListItem {
    id: number;
    fullName: string;
    phoneNumber: string;
    email: string;
    personalId: string;
    totalTickets: number;
}

export const fetchCustomers = async (): Promise<CustomerListItem[]> => {
    const response = await api.get<CustomerListItem[]>('/customers');
    return response.data;
};