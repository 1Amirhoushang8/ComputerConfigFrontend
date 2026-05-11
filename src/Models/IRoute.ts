export interface IRoute {
    path: string;
    component: React.LazyExoticComponent<React.ComponentType<any>>;
    exact?: boolean;
    name: string;         // used for sidebar / breadcrumbs
    showInMenu: boolean;  // if false, hidden from navigation (e.g., `/track` public page)
}