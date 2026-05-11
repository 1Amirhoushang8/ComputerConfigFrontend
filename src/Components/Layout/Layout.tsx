import { Link, useLocation } from 'react-router-dom';
import routes from '../../routes';
import './Layout.scss';

const Layout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const menuRoutes = routes.filter(r => r.showInMenu);

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            {/* Sidebar with glassmorphism + neon */}
            <aside className="sidebar-glass d-flex flex-column flex-shrink-0 p-3">
                <h5 className="sidebar-title mb-4 text-center">پنل ادمین تعمیرگاه 💻</h5>
                <ul className="nav flex-column">
                    {menuRoutes.map(route => (
                        <li className="nav-item" key={route.path}>
                            <Link
                                to={route.path}
                                className={`sidebar-link nav-link ${
                                    location.pathname === route.path ? 'active' : ''
                                }`}
                            >
                                {route.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </aside>

            {/* Main content */}
            <main className="flex-grow-1 p-4 main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;