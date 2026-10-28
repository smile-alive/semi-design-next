import { IconBell, IconBytedanceLogo, IconHelpCircle, IconHome, IconLive, IconSemiLogo, IconSetting } from '@fibrae/semi-icons-solid';
import { Avatar, Breadcrumb, Button, Layout, Nav, Skeleton } from '@fibrae/semi-ui-solid';

export default function LayoutDemo() {
    return (
        <Layout style={{ border: '1px solid var(--semi-color-border)' }}>
            <Layout.Header style={{ 'background-color': 'var(--semi-color-bg-1)' }}>
                <div>
                    <Nav mode="horizontal" defaultSelectedKeys={['Home']}>
                        <Nav.Header>
                            <IconSemiLogo style={{ 'font-size': '36px' }} />
                        </Nav.Header>
                        <Nav.Item itemKey="Home" text="首页" icon={<IconHome size="large" />} />
                        <Nav.Item itemKey="Live" text="直播" icon={<IconLive size="large" />} />
                        <Nav.Item itemKey="Setting" text="设置" icon={<IconSetting size="large" />} />
                        <Nav.Footer>
                            <Button theme="borderless" aria-label="通知" icon={<IconBell size="large" />} style={{ color: 'var(--semi-color-text-2)', 'margin-right': '12px' }} />
                            <Button theme="borderless" aria-label="帮助" icon={<IconHelpCircle size="large" />} style={{ color: 'var(--semi-color-text-2)', 'margin-right': '12px' }} />
                            <Avatar color="orange" size="small">
                                YJ
                            </Avatar>
                        </Nav.Footer>
                    </Nav>
                </div>
            </Layout.Header>
            <Layout.Content style={{ padding: '24px', 'background-color': 'var(--semi-color-bg-0)' }}>
                <Breadcrumb style={{ 'margin-bottom': '24px' }} routes={['首页', '当这个页面标题很长时需要省略', '上一页', '详情页']} />
                <div style={{ 'border-radius': '10px', border: '1px solid var(--semi-color-border)', height: '376px', padding: '32px' }}>
                    <Skeleton placeholder={<Skeleton.Paragraph rows={2} />} loading>
                        <p>Hi, Bytedance dance dance.</p>
                        <p>Hi, Bytedance dance dance.</p>
                    </Skeleton>
                </div>
            </Layout.Content>
            <Layout.Footer style={{ display: 'flex', 'justify-content': 'space-between', padding: '20px', color: 'var(--semi-color-text-2)', 'background-color': 'var(--semi-grey-0)' }}>
                <span style={{ display: 'flex', 'align-items': 'center' }}>
                    <IconBytedanceLogo size="large" style={{ 'margin-right': '8px' }} />
                    <span>Copyright © 2023 ByteDance. All Rights Reserved. </span>
                </span>
                <span>
                    <span style={{ 'margin-right': '24px' }}>平台客服</span>
                    <span>反馈建议</span>
                </span>
            </Layout.Footer>
        </Layout>
    );
}
