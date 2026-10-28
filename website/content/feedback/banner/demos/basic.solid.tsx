import { createSignal, Show } from 'solid-js';
import { Banner, Button, Layout } from '@fibrae/semi-ui-solid';

const commonStyle = {
    height: '64px',
    'line-height': '64px',
    background: 'var(--semi-color-fill-0)',
};

export default function BannerDemo() {
    const [visible, setVisible] = createSignal(false);
    const changeVisible = () => {
        setVisible(!visible());
    };

    return (
        <>
            <Layout class="components-layout-demo banner-basic">
                <Layout.Header style={commonStyle}>Header</Layout.Header>
                <Show when={visible()}>
                    <Banner onClose={changeVisible} description="Semi D2C 现已支持 Figma DevMode, 安装插件，随时查阅图层对应的前端代码" />
                </Show>
                <Layout.Content style={{ height: '300px', 'line-height': '300px' }}>Content</Layout.Content>
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
                {visible() ? 'Hide Banner' : 'Show Banner'}
            </Button>
        </>
    );
}
