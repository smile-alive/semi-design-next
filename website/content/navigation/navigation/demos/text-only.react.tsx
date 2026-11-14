import { Nav } from '@fibrae/semi-ui-react';

const items = [
    { itemKey: 'user', text: '用户管理' },
    { itemKey: 'union', text: '活动管理' },
    { itemKey: 'union-management', text: '任务管理', items: ['公告设置', '任务查询', '信息录入'] },
    { text: '任务平台', itemKey: 'task', items: ['任务管理', '用户任务查询'] },
];

export default function NavigationDemo() {
    return <Nav styles={{ body: { height: 300 } }} defaultOpenKeys={['task']} items={items} onSelect={(data) => console.log('trigger onSelect: ', data)} onClick={(data) => console.log('trigger onClick: ', data)} />;
}
