import { useState } from 'react';
import { Banner, Layout, Button } from '@fibrae/semi-ui-react';

export default function BannerDemo() {
    const [visible, setVisible] = useState(false);
    const changeVisible = () => {
        setVisible(!visible);
    };
    const { Header, Footer, Content } = Layout;

    const commonStyle = {
        height: 64,
        lineHeight: '64px',
        background: 'var(--semi-color-fill-0)',
    };

    const banner = <Banner onClose={changeVisible} description="Semi D2C 现已支持 Figma DevMode, 安装插件，随时查阅图层对应的前端代码" />;
    return (
        <>
            <Layout className="components-layout-demo banner-basic">
                <Header style={commonStyle}>Header</Header>
                {visible && banner}
                <Content style={{ height: 300, lineHeight: '300px' }}>Content</Content>
                <Footer style={commonStyle}>Footer</Footer>
            </Layout>
            <Button
                onClick={changeVisible}
                style={{
                    display: 'block',
                    width: '120px',
                    margin: '0 auto',
                }}
            >
                {visible ? 'Hide Banner' : 'Show Banner'}
            </Button>
        </>
    );
}
