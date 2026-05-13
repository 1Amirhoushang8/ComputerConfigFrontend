import api from './axiosInstance';
import type {UpdateCustomerPayload} from "../Models/UpdateCustomerPayload.ts"
import type {CustomerListItem} from "../Models/CustomerListItem.ts"





export const fetchCustomers = async (): Promise<CustomerListItem[]> => {
    const response = await api.get<CustomerListItem[]>('/customers');
    return response.data;
};


export const updateCustomer = async (id: number, data: UpdateCustomerPayload) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
};

export const deleteCustomer = async (id: number) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
};