import { Dynamic } from 'solid-js/web';
import { IconSemiLogo } from '@fibrae/semi-icons-solid';
import { IconForm, IconBadge, IconBanner, IconTree } from '@fibrae/semi-icons-solid/lab';
import { Nav } from '@fibrae/semi-ui-solid';

const items = [
    { itemKey: 'user', text: '用户管理' },
    { itemKey: 'union', text: '活动管理' },
    { itemKey: 'union-management', text: '任务管理', items: ['公告设置', '任务查询', '信息录入'] },
    { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
];
const icons: Record<string, typeof IconBadge> = { user: IconBadge, union: IconBanner, 'union-management': IconForm, job: IconTree };

export default function NavigationDemo() {
    return (
        <Nav
            defaultOpenKeys={['job']}
            defaultSelectedKeys={['信息录入']}
            defaultIsCollapsed
            styles={{ body: { height: '300px' } }}
            items={items}
            renderItemIcon={(renderProps) => <Dynamic component={icons[String(renderProps.item.itemKey)]} />}
            header={{
                logo: () => <IconSemiLogo style={{ height: '36px', 'font-size': '36px' }} />,
                text: 'Semi 运营后台',
            }}
            footer={{
                collapseButton: true,
            }}
        />
    );
}
