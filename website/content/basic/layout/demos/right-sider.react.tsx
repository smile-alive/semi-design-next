import { Layout } from '@fibrae/semi-ui-react';

const commonStyle = {
    height: '64px',
    lineHeight: '64px',
    background: 'var(--semi-color-fill-0)',
};

export default function LayoutDemo() {
    return (
        <Layout className="components-layout-demo">
            <Layout.Header style={commonStyle}>Header</Layout.Header>
            <Layout>
                <Layout.Content style={{ height: '300px', lineHeight: '300px' }}>Content</Layout.Content>
                <Layout.Sider style={{ width: '120px', background: 'var(--semi-color-fill-2)' }}>Sider</Layout.Sider>
            </Layout>
            <Layout.Footer style={commonStyle}>Footer</Layout.Footer>
        </Layout>
    );
}
