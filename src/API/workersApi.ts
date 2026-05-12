import api from './axiosInstance';

export interface WorkerListItem {
    id: number;
    fullName: string;
    phoneNumber: string;
    personalId: string;
    activeTicketCount: number;
    currentStatus: string;
}

export const fetchWorkers = async (): Promise<WorkerListItem[]> => {
    const response = await api.get<WorkerListItem[]>('/workers');
    return response.data;
};