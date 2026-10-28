import { IconArticle, IconHome } from '@fibrae/semi-icons-solid';
import { Breadcrumb, type BreadcrumbRouteProps } from '@fibrae/semi-ui-solid';

export default function BreadcrumbDemo() {
    const iconRoutes = [
        {
            path: '/',
            href: '/',
        },
        {
            path: '/breadcrumb',
            href: '/zh-CN/navigation/breadcrumb',
            name: 'breadcrumb',
        },
        'with icon',
    ];

    const renderIcon = (route: BreadcrumbRouteProps) => (route.path === '/' ? <IconHome aria-label="首页" size="small" /> : route.path === '/breadcrumb' ? <IconArticle size="small" /> : undefined);

    // Several breadcrumbs on one page are told apart by aria-label
    return (
        <div>
            <Breadcrumb routes={['Semi-ui', 'Breadcrumb', 'Default']} aria-label="字符串路由" />
            <br />
            <Breadcrumb aria-label="带图标的路由" routes={iconRoutes} renderIcon={renderIcon} />
            <br />
            <Breadcrumb routes={['首页', '当这个页面标题很长时需要省略', '详情页']} aria-label="长标题路由" />
        </div>
    );
}
