import { IconSemiLogo } from '@fibrae/semi-icons-react';
import { IconTreeSelect, IconForm, IconBanner, IconBadge } from '@fibrae/semi-icons-react/lab';
import { Nav } from '@fibrae/semi-ui-react';

export default function NavigationDemo() {
    return (
        <div style={{ width: '100%' }}>
            <Nav
                bodyStyle={{ height: 300 }}
                items={[
                    { itemKey: 'user', text: '用户管理', icon: <IconBadge /> },
                    { itemKey: 'union', text: '活动管理', icon: <IconTreeSelect /> },
                    {
                        itemKey: 'union-management',
                        text: '任务管理',
                        icon: <IconForm />,
                        items: ['任务设置', '任务查询', '信息录入'],
                    },
                    {
                        text: '公告管理',
                        icon: <IconBanner />,
                        itemKey: 'job',
                        items: ['推送管理', '已推送查询'],
                    },
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
        </div>
    );
}
