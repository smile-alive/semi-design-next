import { IconBell, IconHelpCircle, IconBytedanceLogo, IconHome, IconHistogram, IconLive, IconSetting, IconSemiLogo } from '@fibrae/semi-icons-react';
import { Layout, Nav, Button, Breadcrumb, Skeleton, Avatar } from '@fibrae/semi-ui-react';

const items = [
    { itemKey: 'Home', text: '首页', icon: <IconHome size="large" /> },
    { itemKey: 'Histogram', text: '基础数据', icon: <IconHistogram size="large" /> },
    { itemKey: 'Live', text: '测试功能', icon: <IconLive size="large" /> },
    { itemKey: 'Setting', text: '设置', icon: <IconSetting size="large" /> },
];

export default function LayoutDemo() {
    return (
        <Layout style={{ border: '1px solid var(--semi-color-border)' }}>
            <Layout.Sider style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
                <Nav
                    aria-label="侧边导航"
                    defaultSelectedKeys={['Home']}
                    style={{ maxWidth: '220px', height: '100%' }}
                    items={items}
                    header={{
                        logo: <IconSemiLogo style={{ fontSize: '36px' }} />,
                        text: 'Semi Design',
                    }}
                    footer={{
                        collapseButton: true,
                    }}
                />
            </Layout.Sider>
            <Layout>
                <Layout.Header style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
                    <Nav
                        aria-label="顶部导航"
                        mode="horizontal"
                        footer={
                            <>
                                <Button
                                    theme="borderless"
                                    aria-label="通知"
                                    icon={<IconBell size="large" />}
                                    style={{
                                        color: 'var(--semi-color-text-2)',
                                        marginInlineEnd: '12px',
                                    }}
                                />
                                <Button
                                    theme="borderless"
                                    aria-label="帮助"
                                    icon={<IconHelpCircle size="large" />}
                                    style={{
                                        color: 'var(--semi-color-text-2)',
                                        marginInlineEnd: '12px',
                                    }}
                                />
                                <Avatar color="orange" size="small">
                                    YJ
                                </Avatar>
                            </>
                        }
                    />
                </Layout.Header>
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
                        routes={['首页', '当这个页面标题很长时需要省略', '上一页', '详情页']}
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
                <Layout.Footer
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '20px',
                        color: 'var(--semi-color-text-2)',
                        backgroundColor: 'var(--semi-grey-0)',
                    }}
                >
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <IconBytedanceLogo size="large" style={{ marginInlineEnd: '8px' }} />
                        <span>Copyright © 2019 ByteDance. All Rights Reserved. </span>
                    </span>
                    <span>
                        <span style={{ marginInlineEnd: '24px' }}>平台客服</span>
                        <span>反馈建议</span>
                    </span>
                </Layout.Footer>
            </Layout>
        </Layout>
    );
}
