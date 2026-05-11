import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Suspense } from 'react';
import Layout from '../Components/Layout/Layout';
import LoadingSpinner from '../Components/LoadingSpinner/LoadingSpinner';
import routes from './index';

const router = createBrowserRouter([
    {
        element: <Layout />,
        children: routes.map((route) => ({
            path: route.path === '/' ? undefined : route.path,   // root becomes index
            index: route.path === '/',
            element: (
                <Suspense fallback={<LoadingSpinner />}>
                    <route.component />
                </Suspense>
            ),
        })),
    },
]);

const AppRouter = () => {
    return <RouterProvider router={router} />;
};

export default AppRouter;