import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import routes from './index';
import Layout from '../Components/Layout/Layout';


const AppRouter = () => {
    return (
        <BrowserRouter>
            <Layout>
                <Suspense >
                    <Routes>
                        {routes.map((route) => (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={<route.component />}
                            />
                        ))}
                    </Routes>
                </Suspense>
            </Layout>
        </BrowserRouter>
    );
};

export default AppRouter;