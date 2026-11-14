import { IconSemiLogo } from '@fibrae/semi-icons-react';
import { IconForm, IconBadge, IconBanner } from '@fibrae/semi-icons-react/lab';
import { Nav } from '@fibrae/semi-ui-react';

const items = [
    { itemKey: 'user', text: '用户管理', icon: <IconBadge /> },
    { itemKey: 'union', text: '活动管理', icon: <IconBanner /> },
    { itemKey: 'job', text: '任务平台', icon: <IconForm />, items: ['任务管理', '用户任务查询'] },
];

export default function NavigationDemo() {
    return (
        <Nav
            toggleIconPosition="left"
            defaultOpenKeys={['job']}
            styles={{ body: { height: 300 } }}
            items={items}
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
