import { IconSemiLogo } from '@fibrae/semi-icons-react';
import { IconForm, IconBadge, IconBanner, IconTree } from '@fibrae/semi-icons-react/lab';
import { Nav } from '@fibrae/semi-ui-react';

export default function NavigationDemo() {
    return (
        <Nav
            defaultOpenKeys={['job']}
            defaultSelectedKeys={['信息录入']}
            defaultIsCollapsed
            bodyStyle={{ height: 300 }}
            items={[
                { itemKey: 'user', text: '用户管理', icon: <IconBadge /> },
                { itemKey: 'union', text: '活动管理', icon: <IconBanner /> },
                {
                    itemKey: 'union-management',
                    text: '任务管理',
                    icon: <IconForm />,
                    items: ['公告设置', '任务查询', '信息录入'],
                },
                {
                    text: '任务平台',
                    icon: <IconTree />,
                    itemKey: 'job',
                    items: ['任务管理', '用户任务查询'],
                },
            ]}
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
