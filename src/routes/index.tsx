import { lazy } from 'react';
import type { IRoute } from '../Models/IRoute';

const PCServices = lazy(() => import('../Features/PCServices/PCServices'));
const WorkersServices = lazy(() => import('../Features/WorkersServices/WorkersServices'));
const FinancialService = lazy(() => import('../Features/Financial/FinancialService'));
const CustomersServices = lazy(() => import('../Features/CustomersService/CustomersService'));
const CustomerRequestsList = lazy(() => import('../Features/CustomerRequestsList/CustomerRequestsList'));


const routes: IRoute[] = [
    {
        path: 'PCServices',
        component: PCServices,
        name: 'مدیریت سیستم ها',
        showInMenu: true,
    },
    {
        path: 'WorkersServices',
        component: WorkersServices,
        name: 'مدیریت تعمیرکاران',
        showInMenu: true,
        roles: ['admin'],
    },
    {
        path: 'CustomersServices',
        component: CustomersServices,
        name: 'مدیریت مشتری ها',
        showInMenu: true,
        roles: ['admin', 'worker'],
    },
    {
        path: 'FinancialService',
        component: FinancialService,
        name: 'مدیریت مالی',
        showInMenu: true,
        roles: ['admin'],
    },
    {
        path: 'CustomerRequestsList',
        component: CustomerRequestsList,
        name: 'درخواست‌ها',
        showInMenu: true,
        roles: ['admin', 'worker'],
    },

];

export default routes;