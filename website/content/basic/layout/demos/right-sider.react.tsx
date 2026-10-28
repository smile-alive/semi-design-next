import { Layout } from '@fibrae/semi-ui-react';

export default function LayoutDemo() {
    const { Header, Footer, Sider, Content } = Layout;
    const commonStyle = {
        height: 64,
        lineHeight: '64px',
        background: 'var(--semi-color-fill-0)',
    };
    return (
        <Layout className="components-layout-demo">
            <Header style={commonStyle}>Header</Header>
            <Layout>
                <Content style={{ height: 300, lineHeight: '300px' }}>Content</Content>
                <Sider style={{ width: '120px', background: 'var(--semi-color-fill-2)' }}>Sider</Sider>
            </Layout>
            <Footer style={commonStyle}>Footer</Footer>
        </Layout>
    );
}
