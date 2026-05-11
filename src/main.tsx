import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './routes/AppRouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


import 'bootstrap/dist/css/bootstrap.rtl.min.css';


import 'vazirmatn/Vazirmatn-font-face.css';

import './index.css';


const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AppRouter />
        </QueryClientProvider>
    </React.StrictMode>
);