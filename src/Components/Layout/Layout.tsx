import { Link, useLocation, Outlet } from 'react-router-dom';
import routes from '../../routes';
import './Layout.scss';
import PageTransition from '../PageTransition/PageTransition';

const Layout = () => {
    const location = useLocation();
    const menuRoutes = routes.filter(r => r.showInMenu);

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
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

            <main className="flex-grow-1 p-4 main-content">
                <PageTransition>
                    <Outlet />
                </PageTransition>
            </main>
        </div>
    );
};

export default Layout;