import { Layout, type SiderProps } from '@fibrae/semi-ui-react';

export default function LayoutDemo() {
    const onbreakpoint: SiderProps['onBreakpoint'] = (screen, bool) => {
        console.log(screen, bool);
    };
    const commonStyle = {
        height: 64,
        lineHeight: '64px',
        background: 'var(--semi-color-fill-0)',
    };
    const { Header, Footer, Sider, Content } = Layout;
    return (
        <Layout className="components-layout-demo">
            <Header style={commonStyle}>Header</Header>
            <Layout>
                <Sider style={{ width: '120px', background: 'var(--semi-color-fill-2)' }} breakpoint={['md']} onBreakpoint={onbreakpoint}>
                    Sider
                </Sider>
                <Content style={{ height: 300, lineHeight: '300px' }}>Content</Content>
            </Layout>
            <Footer style={commonStyle}>Footer</Footer>
        </Layout>
    );
}
