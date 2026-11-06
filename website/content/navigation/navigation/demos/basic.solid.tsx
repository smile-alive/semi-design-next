import { Dynamic } from 'solid-js/web';
import { IconSemiLogo } from '@fibrae/semi-icons-solid';
import { IconDescriptions, IconTree, IconAvatar } from '@fibrae/semi-icons-solid/lab';
import { Nav } from '@fibrae/semi-ui-solid';

const items = [
    { itemKey: 'user', text: '用户管理' },
    { itemKey: 'union', text: '活动管理' },
    { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
];
const icons: Record<string, typeof IconAvatar> = { user: IconAvatar, union: IconDescriptions, job: IconTree };

export default function NavigationDemo() {
    return (
        <Nav
            bodyStyle={{ height: '320px' }}
            items={items}
            renderItemIcon={(renderProps) => <Dynamic component={icons[String(renderProps.item.itemKey)]} />}
            header={{
                logo: () => <IconSemiLogo style={{ height: '36px', 'font-size': '36px' }} />,
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
