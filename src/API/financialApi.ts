import api from './axiosInstance';

export interface FinancialRecordListItem {
    id: number;
    title: string;
    amount: number;
    dateTime: string;
    ticketTrackingCode: string | null;
    description: string;
    type: string;
}

export interface CreateFinancialRecordPayload {
    title: string;
    amount: number;
    dateTime: string;
    ticketId?: number;
    description: string;
    type: string;
}

export type UpdateFinancialRecordPayload = CreateFinancialRecordPayload;

export const fetchFinancialRecords = async (): Promise<FinancialRecordListItem[]> => {
    const response = await api.get<FinancialRecordListItem[]>('/financial');
    return response.data;
};

export const createFinancialRecord = async (data: CreateFinancialRecordPayload): Promise<FinancialRecordListItem> => {
    const response = await api.post<FinancialRecordListItem>('/financial', data);
    return response.data;
};

export const updateFinancialRecord = async (id: number, data: UpdateFinancialRecordPayload): Promise<FinancialRecordListItem> => {
    const response = await api.put<FinancialRecordListItem>(`/financial/${id}`, data);
    return response.data;
};

export const deleteFinancialRecord = async (id: number) => {
    const response = await api.delete(`/financial/${id}`);
    return response.data;
};

