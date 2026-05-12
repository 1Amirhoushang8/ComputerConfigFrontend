export interface IRoute {
    path: string;
    component: React.LazyExoticComponent<React.ComponentType<any>>;
    exact?: boolean;
    name: string;
    showInMenu: boolean;
    roles?: string[];
}