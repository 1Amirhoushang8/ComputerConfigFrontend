import { lazy } from 'react';
import type { IRoute } from '../Models/IRoute';

const PCServices = lazy(() => import('../Features/PCServices/PCServices.tsx'));
const WorkersServices = lazy(() => import('../Features/WorkersServices/WorkersServices.tsx'));
const FinancialService = lazy(() => import('../Features/Financial/FinancialService.tsx'));
const CustomersServices = lazy(() => import('../Features/CustomersService/CustomersService.tsx'));

const routes: IRoute[] = [
    {
        path: '/',
        component: PCServices, // reuse the same lazy-loaded component
        name: 'Home',
        showInMenu: false,
    },
    {
        path: '/PCServices',
        component: PCServices,
        name: 'مدیریت سیستم ها',
        showInMenu: true,
    },
    {
        path: '/WorkersServices',
        component: WorkersServices,
        name: 'مدیریت تعمیرکاران',
        showInMenu: true,
    },
    {
        path: '/CustomersServices',
        component: CustomersServices,
        name: 'مدیریت مشتری ها',
        showInMenu: true,
    },
    {
        path: '/FinancialService',
        component: FinancialService,
        name: 'مدیریت مالی',
        showInMenu: true,
    },
];

export default routes;