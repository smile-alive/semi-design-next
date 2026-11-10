import { useState } from 'react';
import { Banner, Layout, Button } from '@fibrae/semi-ui-react';

const commonStyle = {
    height: 64,
    lineHeight: '64px',
    background: 'var(--semi-color-fill-0)',
};

export default function BannerDemo() {
    const [visible, setVisible] = useState(false);
    const changeVisible = () => {
        setVisible(!visible);
    };

    return (
        <>
            <Layout className="components-layout-demo banner-basic">
                <Layout.Header style={commonStyle}>Header</Layout.Header>
                {visible && <Banner onClose={changeVisible} description="一套组件，四个框架原生可用，随时查阅对应的前端代码" />}
                <Layout.Content style={{ height: 300, lineHeight: '300px' }}>Content</Layout.Content>
                <Layout.Footer style={commonStyle}>Footer</Layout.Footer>
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
