import { useState } from 'react';
import { IconSemiLogo } from '@fibrae/semi-icons-react';
import { IconForm, IconBadge, IconBanner, IconTree } from '@fibrae/semi-icons-react/lab';
import { Nav, type NavItemKey as ItemKey, type NavProps } from '@fibrae/semi-ui-react';

const items = [
    { itemKey: 'user', text: '用户管理', icon: <IconBadge /> },
    { itemKey: 'union', text: '活动管理', icon: <IconBanner /> },
    { itemKey: 'union-management', text: '任务管理', icon: <IconForm />, items: ['公告设置', '任务查询', '信息录入'] },
    { itemKey: 'job', text: '任务平台', icon: <IconTree />, items: ['任务管理', '用户任务查询'] },
];

export default function NavigationDemo() {
    const [openKeys, setOpenKeys] = useState<ItemKey[]>(['union-management', 'job']);
    const [selectedKeys, setSelectedKeys] = useState<ItemKey[]>(['公告设置']);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const onSelect: NavProps['onSelect'] = (data) => {
        console.log('trigger onSelect: ', data);
        setSelectedKeys([...data.selectedKeys]);
    };
    const onOpenChange: NavProps['onOpenChange'] = (data) => {
        console.log('trigger onOpenChange: ', data);
        setOpenKeys([...(data.openKeys ?? [])]);
    };

    const onCollapseChange = (isCollapsed: boolean) => {
        setIsCollapsed(isCollapsed);
    };

    return (
        <Nav
            isCollapsed={isCollapsed}
            openKeys={openKeys}
            selectedKeys={selectedKeys}
            bodyStyle={{ height: 300 }}
            items={items}
            header={{
                logo: <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />,
                text: 'Semi 运营后台',
            }}
            footer={{
                collapseButton: true,
            }}
            onCollapseChange={onCollapseChange}
            onOpenChange={onOpenChange}
            onSelect={onSelect}
        />
    );
}
