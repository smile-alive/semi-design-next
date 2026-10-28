import { IconSemiLogo } from '@fibrae/semi-icons-react';
import { IconDescriptions, IconTree, IconAvatar } from '@fibrae/semi-icons-react/lab';
import { Nav } from '@fibrae/semi-ui-react';

export default function NavigationDemo() {
    return (
        <Nav
            bodyStyle={{ height: 320 }}
            items={[
                { itemKey: 'user', text: '用户管理', icon: <IconAvatar /> },
                { itemKey: 'union', text: '活动管理', icon: <IconDescriptions /> },
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
            onSelect={(data) => console.log('trigger onSelect: ', data)}
            onClick={(data) => console.log('trigger onClick: ', data)}
        />
    );
}
