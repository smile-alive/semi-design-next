import { Dynamic } from 'solid-js/web';
import { IconSemiLogo } from '@fibrae/semi-icons-solid';
import { IconForm, IconBadge, IconBanner } from '@fibrae/semi-icons-solid/lab';
import { Nav } from '@fibrae/semi-ui-solid';

const icons: Record<string, typeof IconBadge> = { user: IconBadge, union: IconBanner, job: IconForm };

export default function NavigationDemo() {
    return (
        <Nav
            toggleIconPosition="left"
            defaultOpenKeys={['job']}
            bodyStyle={{ height: '300px' }}
            items={[
                { itemKey: 'user', text: '用户管理' },
                { itemKey: 'union', text: '活动管理' },
                {
                    text: '任务平台',
                    itemKey: 'job',
                    items: ['任务管理', '用户任务查询'],
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
