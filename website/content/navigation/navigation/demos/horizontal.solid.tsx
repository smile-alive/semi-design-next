import { Dynamic } from 'solid-js/web';
import { IconSemiLogo } from '@fibrae/semi-icons-solid';
import { IconTreeSelect, IconBreadcrumb, IconBadge, IconSteps } from '@fibrae/semi-icons-solid/lab';
import { Nav, Avatar, Dropdown } from '@fibrae/semi-ui-solid';

const icons: Record<string, typeof IconBadge> = { user: IconBadge, union: IconTreeSelect, 'approve-management': IconBreadcrumb, job: IconSteps };

export default function NavigationDemo() {
    return (
        <div style={{ width: '100%' }}>
            <Nav
                mode="horizontal"
                items={[
                    { itemKey: 'user', text: '用户管理' },
                    { itemKey: 'union', text: '活动管理' },
                    {
                        itemKey: 'approve-management',
                        text: '审批管理',
                        items: [
                            '入驻审核',
                            {
                                itemKey: 'operation-management',
                                text: '运营管理',
                                items: ['人员管理', '人员变更'],
                            },
                        ],
                    },
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
                footer={
                    <Dropdown
                        position="bottomRight"
                        render={
                            <Dropdown.Menu>
                                <Dropdown.Item>详情</Dropdown.Item>
                                <Dropdown.Item>退出</Dropdown.Item>
                            </Dropdown.Menu>
                        }
                    >
                        <Avatar size="small" color="light-blue" style={{ margin: '4px' }}>
                            BD
                        </Avatar>
                        <span>Bytedancer</span>
                    </Dropdown>
                }
            />
        </div>
    );
}
