import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import routes from '../../routes';
import { useAuth } from '../../hooks/useAuth';
import './Layout.scss';
import PageTransition from '../PageTransition/PageTransition';

const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const menuRoutes = routes.filter(route => {
        if (!route.showInMenu) return false;
        if (route.roles && route.roles.length > 0) {
            return user?.role && route.roles.includes(user.role);
        }
        return true;
    });

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    return (
        <div className="d-flex layout-wrapper">
            {/* Sidebar – always on desktop, overlay on mobile */}
            <aside
                className={`sidebar-glass d-flex flex-column flex-shrink-0 p-3 ${
                    isMobile ? (sidebarOpen ? 'sidebar-open' : 'sidebar-closed') : ''
                }`}
            >
                <h5 className="sidebar-title mb-4 text-center">پنل ادمین تعمیرگاه 💻</h5>
                <ul className="nav flex-column flex-grow-1">
                    {menuRoutes.map(route => (
                        <li className="nav-item" key={route.path}>
                            <Link
                                to={`/app/${route.path}`}
                                className={`sidebar-link nav-link ${
                                    location.pathname === `/app/${route.path}` ? 'active' : ''
                                }`}
                            >
                                {route.name}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="mt-auto pt-3 border-top border-secondary">
                    <button onClick={handleLogout} className="btn btn-outline-light w-100 sidebar-logout-btn">
                        خروج از سیستم
                    </button>
                </div>
            </aside>

            {/* Overlay backdrop for mobile sidebar */}
            {isMobile && sidebarOpen && (
                <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main content */}
            <main className="flex-grow-1 p-4 main-content">
                {/* Mobile menu toggle button */}
                {isMobile && (
                    <button
                        className="btn btn-dark mb-3 d-inline-flex align-items-center gap-2"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                        </svg>
                        منو
                    </button>
                )}

                <PageTransition>
                    <Outlet />
                </PageTransition>
            </main>
        </div>
    );
};

export default Layout;