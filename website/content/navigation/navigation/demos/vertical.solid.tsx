import { Dynamic } from 'solid-js/web';
import { IconSemiLogo } from '@fibrae/semi-icons-solid';
import { IconTreeSelect, IconForm, IconBanner, IconBadge } from '@fibrae/semi-icons-solid/lab';
import { Nav } from '@fibrae/semi-ui-solid';

const items = [
    { itemKey: 'user', text: '用户管理' },
    { itemKey: 'union', text: '活动管理' },
    { itemKey: 'union-management', text: '任务管理', items: ['任务设置', '任务查询', '信息录入'] },
    { itemKey: 'job', text: '公告管理', items: ['推送管理', '已推送查询'] },
];
const icons: Record<string, typeof IconBadge> = { user: IconBadge, union: IconTreeSelect, 'union-management': IconForm, job: IconBanner };

export default function NavigationDemo() {
    return (
        <div style={{ width: '100%' }}>
            <Nav
                styles={{ body: { height: '300px' } }}
                items={items}
                renderItemIcon={(renderProps) => <Dynamic component={icons[String(renderProps.item.itemKey)]} />}
                onSelect={(key) => console.log(key)}
                header={{
                    logo: () => <IconSemiLogo style={{ height: '36px', 'font-size': '36px' }} />,
                    text: 'Semi 运营后台',
                }}
                footer={{
                    collapseButton: true,
                }}
            />
        </div>
    );
}
