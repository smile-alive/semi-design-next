import { IconSemiLogo, IconBytedanceLogo } from '@fibrae/semi-icons-react';
import { IconTreeSelect, IconBreadcrumb, IconBadge, IconSteps } from '@fibrae/semi-icons-react/lab';
import { Nav, Avatar, Dropdown, Layout, Breadcrumb, Skeleton } from '@fibrae/semi-ui-react';

const currentYear = 2024;

const operationItem = {
    itemKey: 'operation-management',
    text: '运营管理',
    items: ['人员管理', '人员变更'],
};
const topItems = [
    { itemKey: 'user', text: '用户管理', icon: <IconBadge /> },
    { itemKey: 'union', text: '活动管理', icon: <IconTreeSelect /> },
    { itemKey: 'approve-management', text: '审批管理', icon: <IconBreadcrumb />, items: ['入驻审核', operationItem] },
    { itemKey: 'job', text: '任务平台', icon: <IconSteps />, items: ['任务管理', '用户任务查询'] },
];
const leftItems = [
    { itemKey: 'approve-management', text: '审批管理', icon: <IconBreadcrumb />, items: ['入驻审核', operationItem] },
    { itemKey: 'job', text: '任务平台', icon: <IconSteps />, items: ['任务管理', '用户任务查询'] },
    { itemKey: 'user', text: '用户管理', icon: <IconBadge /> },
    { itemKey: 'union', text: '活动管理', icon: <IconTreeSelect /> },
];
const routes = ['首页', '当这个页面标题很长时需要省略', '上一页', '详情页'];

function TopHeader() {
    return (
        <Layout.Header style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
            <div>
                <Nav
                    aria-label="顶部导航"
                    mode="horizontal"
                    items={topItems}
                    onSelect={(key) => console.log(key)}
                    header={{
                        logo: <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />,
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
                            <Avatar size="small" color="light-blue" style={{ margin: 4 }}>
                                BD
                            </Avatar>
                            <span>Bytedancer</span>
                        </Dropdown>
                    }
                />
            </div>
        </Layout.Header>
    );
}

function LeftNav() {
    return (
        <Nav
            aria-label="侧边导航"
            style={{ maxWidth: 220, height: '100%' }}
            items={leftItems}
            footer={{
                collapseButton: true,
            }}
        />
    );
}

function FooterContent() {
    return (
        <>
            <span
                style={{
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <IconBytedanceLogo size="large" style={{ marginInlineEnd: '8px' }} />
                <span>Copyright © {currentYear} ByteDance. All Rights Reserved. </span>
            </span>
            <span>
                <span style={{ marginInlineEnd: '24px' }}>平台客服</span>
                <span>反馈建议</span>
            </span>
        </>
    );
}

export default function NavigationDemo() {
    return (
        <Layout style={{ border: '1px solid var(--semi-color-border)' }}>
            <TopHeader />
            <Layout>
                <Layout.Sider style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
                    <LeftNav />
                </Layout.Sider>
                <Layout.Content
                    style={{
                        padding: '24px',
                        backgroundColor: 'var(--semi-color-bg-0)',
                    }}
                >
                    <Breadcrumb
                        style={{
                            marginBlockEnd: '24px',
                        }}
                        routes={routes}
                    />
                    <div
                        style={{
                            borderRadius: '10px',
                            border: '1px solid var(--semi-color-border)',
                            height: '376px',
                            padding: '32px',
                        }}
                    >
                        <Skeleton placeholder={<Skeleton.Paragraph rows={2} />} loading>
                            <p>Hi, Bytedance dance dance.</p>
                            <p>Hi, Bytedance dance dance.</p>
                        </Skeleton>
                    </div>
                </Layout.Content>
            </Layout>
            <Layout.Footer
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '20px',
                    color: 'var(--semi-color-text-2)',
                    backgroundColor: 'var(--semi-grey-0)',
                }}
            >
                <FooterContent />
            </Layout.Footer>
        </Layout>
    );
}
