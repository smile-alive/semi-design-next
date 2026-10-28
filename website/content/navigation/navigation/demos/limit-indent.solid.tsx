import { Dynamic } from 'solid-js/web';
import { IconSemiLogo } from '@fibrae/semi-icons-solid';
import { IconForm, IconBadge, IconBanner, IconTabs } from '@fibrae/semi-icons-solid/lab';
import { Nav } from '@fibrae/semi-ui-solid';

const icons: Record<string, typeof IconBadge> = { user: IconBadge, job: IconBanner, mission1: IconForm, mission3: IconTabs };

export default function NavigationDemo() {
    return (
        <Nav
            limitIndent={false}
            defaultOpenKeys={['job', 'mission1']}
            bodyStyle={{ height: '300px' }}
            items={[
                { itemKey: 'user', text: '用户管理' },
                {
                    text: '任务平台',
                    itemKey: 'job',
                    items: [
                        '任务管理',
                        {
                            text: '任务1',
                            itemKey: 'mission1',
                            items: [
                                '任务2',
                                {
                                    text: '任务3拆解',
                                    itemKey: 'mission3',
                                    items: ['子任务1', '子任务2'],
                                },
                            ],
                        },
                    ],
                },
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
