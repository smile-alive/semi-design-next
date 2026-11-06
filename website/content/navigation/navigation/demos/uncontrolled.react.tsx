import { IconSemiLogo } from '@fibrae/semi-icons-react';
import { IconForm, IconBadge, IconBanner, IconTree } from '@fibrae/semi-icons-react/lab';
import { Nav } from '@fibrae/semi-ui-react';

const items = [
    { itemKey: 'user', text: '用户管理', icon: <IconBadge /> },
    { itemKey: 'union', text: '活动管理', icon: <IconBanner /> },
    { itemKey: 'union-management', text: '任务管理', icon: <IconForm />, items: ['公告设置', '任务查询', '信息录入'] },
    { itemKey: 'job', text: '任务平台', icon: <IconTree />, items: ['任务管理', '用户任务查询'] },
];

export default function NavigationDemo() {
    return (
        <Nav
            defaultOpenKeys={['job']}
            defaultSelectedKeys={['信息录入']}
            defaultIsCollapsed
            bodyStyle={{ height: 300 }}
            items={items}
            header={{
                logo: <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />,
                text: 'Semi 运营后台',
            }}
            footer={{
                collapseButton: true,
            }}
        />
    );
}
