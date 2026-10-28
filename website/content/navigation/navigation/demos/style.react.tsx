import { IconSemiLogo } from '@fibrae/semi-icons-react';
import { IconTreeSelect, IconForm, IconTree, IconBanner, IconBadge, IconNotification, IconSteps, IconTabs, IconNavigation } from '@fibrae/semi-icons-react/lab';
import { Nav } from '@fibrae/semi-ui-react';

export default function NavigationDemo() {
    return (
        <Nav
            style={{ height: 520 }}
            bodyStyle={{ height: 300 }}
            items={[
                { itemKey: 'user', text: '用户管理', icon: <IconBadge /> },
                { itemKey: '2', text: '订单管理', icon: <IconBanner /> },
                { itemKey: '3', text: '资源管理', icon: <IconTreeSelect /> },
                {
                    text: '任务平台',
                    icon: <IconForm />,
                    itemKey: '4',
                    items: ['任务管理', '用户任务查询'],
                },
                { itemKey: '5', text: '推送通知', icon: <IconNotification /> },
                { itemKey: '6', text: '任务', icon: <IconSteps /> },
                { itemKey: '7', text: '活动管理', icon: <IconTree /> },
                { itemKey: '8', text: '内容工具', icon: <IconTabs /> },
                { itemKey: '9', text: '快捷导航', icon: <IconNavigation /> },
            ]}
            onSelect={(key) => console.log(key)}
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
