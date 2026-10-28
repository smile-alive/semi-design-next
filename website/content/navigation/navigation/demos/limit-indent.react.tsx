import { IconSemiLogo } from '@fibrae/semi-icons-react';
import { IconForm, IconBadge, IconBanner, IconTabs } from '@fibrae/semi-icons-react/lab';
import { Nav } from '@fibrae/semi-ui-react';

export default function NavigationDemo() {
    return (
        <Nav
            limitIndent={false}
            defaultOpenKeys={['job', 'mission1']}
            bodyStyle={{ height: 300 }}
            items={[
                { itemKey: 'user', text: '用户管理', icon: <IconBadge /> },
                {
                    text: '任务平台',
                    icon: <IconBanner />,
                    itemKey: 'job',
                    items: [
                        '任务管理',
                        {
                            text: '任务1',
                            icon: <IconForm />,
                            itemKey: 'mission1',
                            items: [
                                '任务2',
                                {
                                    text: '任务3拆解',
                                    icon: <IconTabs />,
                                    itemKey: 'mission3',
                                    items: ['子任务1', '子任务2'],
                                },
                            ],
                        },
                    ],
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
