import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import LoadingSpinner from '../Components/LoadingSpinner/LoadingSpinner';
import LoginPage from '../Features/LoginPage/LoginPage';
import CustomerDashboard from '../Features/CustomerDashboard/CustomerDashboard';
import ProtectedRoute from '../Components/ProtectedRoute';
import routes from './index';
import CustomerRequests from "../Features/AdminSeeUsersRequests/AdminSeeUsersRequests.tsx";

const router = createBrowserRouter([

    {
        index: true,
        element: <LoginPage />,
    },

    {
        path: 'customer-dashboard',
        element: <CustomerDashboard />,
    },

    {
        path: 'app',
        element: <ProtectedRoute />,
        children: [

            {
                index: true,
                element: <Navigate to="PCServices" replace />,
            },

            ...routes.map((route) => ({
                path: route.path,
                element: (
                    <Suspense fallback={<LoadingSpinner />}>
                        <route.component />
                    </Suspense>
                ),
            })),

            {
                path: 'customer-requests/:customerId',
                element: (
                    <Suspense fallback={<LoadingSpinner />}>
                        <CustomerRequests />
                    </Suspense>
                ),
            },
        ],
    },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;