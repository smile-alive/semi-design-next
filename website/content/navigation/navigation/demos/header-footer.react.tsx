import { IconSemiLogo } from '@fibrae/semi-icons-react';
import { IconForm, IconBadge, IconBanner } from '@fibrae/semi-icons-react/lab';
import { Nav } from '@fibrae/semi-ui-react';

export default function NavigationDemo() {
    return (
        <Nav
            defaultOpenKeys={['task']}
            bodyStyle={{ height: 300 }}
            items={[
                { itemKey: 'user', text: '用户管理', icon: <IconBadge /> },
                { itemKey: 'union', text: '活动管理', icon: <IconBanner /> },
                {
                    text: '任务平台',
                    icon: <IconForm />,
                    itemKey: 'task',
                    items: ['任务管理', '用户任务查询'],
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
    );
}
