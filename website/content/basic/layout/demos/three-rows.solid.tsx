import { Layout } from '@fibrae/semi-ui-solid';

const commonStyle = {
    height: '64px',
    'line-height': '64px',
    background: 'var(--semi-color-fill-0)',
};

export default function LayoutDemo() {
    return (
        <Layout class="components-layout-demo">
            <Layout.Header style={commonStyle}>Header</Layout.Header>
            <Layout.Content style={{ height: '300px', 'line-height': '300px' }}>Content</Layout.Content>
            <Layout.Footer style={commonStyle}>Footer</Layout.Footer>
        </Layout>
    );
}
