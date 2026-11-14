import { IconSemiLogo } from '@fibrae/semi-icons-react';
import { IconDescriptions, IconTree, IconAvatar } from '@fibrae/semi-icons-react/lab';
import { Nav } from '@fibrae/semi-ui-react';

const items = [
    { itemKey: 'user', text: '用户管理', icon: <IconAvatar /> },
    { itemKey: 'union', text: '活动管理', icon: <IconDescriptions /> },
    { itemKey: 'job', text: '任务平台', icon: <IconTree />, items: ['任务管理', '用户任务查询'] },
];

export default function NavigationDemo() {
    return (
        <Nav
            styles={{ body: { height: 320 } }}
            items={items}
            header={{
                logo: <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />,
                text: 'Semi 运营后台',
            }}
            footer={{
                collapseButton: true,
            }}
            onSelect={(data) => console.log('trigger onSelect: ', data)}
            onClick={(data) => console.log('trigger onClick: ', data)}
        />
    );
}
