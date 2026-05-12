import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import routes from '../../routes';
import { useAuth } from '../../hooks/useAuth';
import './Layout.scss';
import PageTransition from '../PageTransition/PageTransition';

const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();


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
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            <aside className="sidebar-glass d-flex flex-column flex-shrink-0 p-3">
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

            <main className="flex-grow-1 p-4 main-content">
                <PageTransition>
                    <Outlet />
                </PageTransition>
            </main>
        </div>
    );
};

export default Layout;