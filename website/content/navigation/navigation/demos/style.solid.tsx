import { Dynamic } from 'solid-js/web';
import { IconSemiLogo } from '@fibrae/semi-icons-solid';
import { IconTreeSelect, IconForm, IconTree, IconBanner, IconBadge, IconNotification, IconSteps, IconTabs, IconNavigation } from '@fibrae/semi-icons-solid/lab';
import { Nav } from '@fibrae/semi-ui-solid';

const icons: Record<string, typeof IconBadge> = {
    user: IconBadge,
    '2': IconBanner,
    '3': IconTreeSelect,
    '4': IconForm,
    '5': IconNotification,
    '6': IconSteps,
    '7': IconTree,
    '8': IconTabs,
    '9': IconNavigation,
};

export default function NavigationDemo() {
    return (
        <Nav
            style={{ height: '520px' }}
            bodyStyle={{ height: '300px' }}
            items={[
                { itemKey: 'user', text: '用户管理' },
                { itemKey: '2', text: '订单管理' },
                { itemKey: '3', text: '资源管理' },
                {
                    text: '任务平台',
                    itemKey: '4',
                    items: ['任务管理', '用户任务查询'],
                },
                { itemKey: '5', text: '推送通知' },
                { itemKey: '6', text: '任务' },
                { itemKey: '7', text: '活动管理' },
                { itemKey: '8', text: '内容工具' },
                { itemKey: '9', text: '快捷导航' },
            ]}
            renderItemIcon={({ item }) => <Dynamic component={icons[String(item.itemKey)]} />}
            onSelect={(key) => console.log(key)}
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
