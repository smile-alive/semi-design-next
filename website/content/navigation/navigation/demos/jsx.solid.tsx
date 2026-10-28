import { IconSemiLogo } from '@fibrae/semi-icons-solid';
import { IconForm, IconTree, IconBadge } from '@fibrae/semi-icons-solid/lab';
import { Nav } from '@fibrae/semi-ui-solid';

export default function NavigationDemo() {
    return (
        <Nav bodyStyle={{ height: '300px' }} defaultOpenKeys={['user']} onSelect={(data) => console.log('trigger onSelect: ', data)} onClick={(data) => console.log('trigger onClick: ', data)}>
            <Nav.Header logo={<IconSemiLogo style={{ height: '36px', 'font-size': '36px' }} />} text="Semi 运营后台" />
            <Nav.Item itemKey="union" text="活动管理" icon={<IconForm />} />
            <Nav.Sub itemKey="user" text="用户管理" icon={<IconBadge />}>
                <Nav.Item itemKey="active" text="活跃用户" />
                <Nav.Item itemKey="negative" text="非活跃用户" />
            </Nav.Sub>
            <Nav.Sub itemKey="union-management" text="任务管理" icon={<IconTree />}>
                <Nav.Item itemKey="notice" text="任务设置" />
                <Nav.Item itemKey="query" text="任务查询" />
                <Nav.Item itemKey="info" text="信息录入" />
            </Nav.Sub>
            <Nav.Footer collapseButton />
        </Nav>
    );
}
