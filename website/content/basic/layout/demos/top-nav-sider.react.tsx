import { IconSemiLogo, IconBell, IconHelpCircle, IconBytedanceLogo, IconHome, IconHistogram, IconLive, IconSetting } from '@fibrae/semi-icons-react';
import { Layout, Nav, Button, Breadcrumb, Skeleton, Avatar } from '@fibrae/semi-ui-react';

export default function LayoutDemo() {
    const { Header, Footer, Sider, Content } = Layout;
    return (
        <Layout style={{ border: '1px solid var(--semi-color-border)' }}>
            <Header style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
                <div>
                    <Nav aria-label="顶部导航" mode="horizontal" defaultSelectedKeys={['Home']}>
                        <Nav.Header>
                            <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />
                        </Nav.Header>
                        <span
                            style={{
                                color: 'var(--semi-color-text-2)',
                            }}
                        >
                            <span
                                style={{
                                    marginRight: '24px',
                                    color: 'var(--semi-color-text-0)',
                                    fontWeight: '600',
                                }}
                            >
                                模版推荐
                            </span>
                            <span style={{ marginRight: '24px' }}>所有模版</span>
                            <span>我的模版</span>
                        </span>
                        <Nav.Footer>
                            <Button
                                theme="borderless"
                                aria-label="通知"
                                icon={<IconBell size="large" />}
                                style={{
                                    color: 'var(--semi-color-text-2)',
                                    marginRight: '12px',
                                }}
                            />
                            <Button
                                theme="borderless"
                                aria-label="帮助"
                                icon={<IconHelpCircle size="large" />}
                                style={{
                                    color: 'var(--semi-color-text-2)',
                                    marginRight: '12px',
                                }}
                            />
                            <Avatar color="orange" size="small">
                                YJ
                            </Avatar>
                        </Nav.Footer>
                    </Nav>
                </div>
            </Header>
            <Layout>
                <Sider style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
                    <Nav
                        aria-label="侧边导航"
                        style={{ maxWidth: 220, height: '100%' }}
                        defaultSelectedKeys={['Home']}
                        items={[
                            { itemKey: 'Home', text: '首页', icon: <IconHome size="large" /> },
                            { itemKey: 'Histogram', text: '基础数据', icon: <IconHistogram size="large" /> },
                            { itemKey: 'Live', text: '测试功能', icon: <IconLive size="large" /> },
                            { itemKey: 'Setting', text: '设置', icon: <IconSetting size="large" /> },
                        ]}
                        footer={{
                            collapseButton: true,
                        }}
                    />
                </Sider>
                <Content
                    style={{
                        padding: '24px',
                        backgroundColor: 'var(--semi-color-bg-0)',
                    }}
                >
                    <Breadcrumb
                        style={{
                            marginBottom: '24px',
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
                </Content>
            </Layout>
            <Footer
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
                    <IconBytedanceLogo size="large" style={{ marginRight: '8px' }} />
                    <span>Copyright © 2023 ByteDance. All Rights Reserved. </span>
                </span>
                <span>
                    <span style={{ marginRight: '24px' }}>平台客服</span>
                    <span>反馈建议</span>
                </span>
            </Footer>
        </Layout>
    );
}
