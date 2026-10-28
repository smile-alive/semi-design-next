import { Breadcrumb, Typography } from '@fibrae/semi-ui-solid';

const routes = ['首页', '当这个页面标题很长很长很长时需要省略', '详情页'];
const { Text } = Typography;

export default function BreadcrumbDemo() {
    // Several breadcrumbs on one page are told apart by aria-label
    return (
        <>
            <Text size="small">默认行为</Text>
            <Breadcrumb routes={routes} aria-label="默认行为" />
            <br />
            <Text size="small">省略但不显示Tooltip</Text>
            <Breadcrumb showTooltip={false} routes={routes} aria-label="省略但不显示Tooltip" />
            <br />
            <Text size="small">不截断</Text>
            <Breadcrumb showTooltip={{ width: 'auto' }} routes={routes} aria-label="不截断" />
            <br />
            <Text size="small">从标题中间开始省略</Text>
            <Breadcrumb showTooltip={{ ellipsisPos: 'middle' }} routes={routes} aria-label="从标题中间开始省略" />
            <br />
            <Text size="small">自定义 Tooltip 参数</Text>
            <Breadcrumb showTooltip={{ opts: { position: 'topLeft' } }} routes={routes} aria-label="自定义 Tooltip 参数" />
        </>
    );
}
