import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from './Layout/Layout';

const ProtectedRoute = () => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (user?.role === 'customer') {
        return <Navigate to="/customer-dashboard" replace />;
    }

    return <Layout />;
};

export default ProtectedRoute;