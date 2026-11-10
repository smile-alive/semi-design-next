<script lang="ts">
    import { Carousel, Space, Typography } from '@fibrae/semi-ui-svelte';

    const logo = '/assets/placeholder/logo.svg';
    const slides = [
        {
            src: '/assets/carousel/bg-1.png',
            title: 'Semi 设计管理系统',
            lines: ['从 Semi Design，到 Any Design', '快速定制你的设计系统，并应用在设计稿和代码中'],
        },
        {
            src: '/assets/carousel/bg-2.png',
            title: 'Semi 物料市场',
            lines: ['面向业务场景的定制化组件，支持线上预览和调试', '内容由 Semi Design 用户共建'],
        },
        {
            src: '/assets/carousel/bg-3.png',
            title: 'Semi 设计/代码模板',
            lines: ['一套组件，四个框架原生可用', '在 React、Vue、Solid、Svelte 中共用同一套设计'],
        },
    ];
    const titleStyle = 'position: absolute; top: 100px; left: 100px';
    const colorStyle = 'color: #1C1F23';
</script>

<div>
    <Carousel animation="fade" autoPlay={false} items={slides} speed={1000} style="width: 100%; height: 400px" theme="dark">
        {#snippet slide({ item })}
            <div style="height: 100%; background-size: cover; background-image: url('{item.src}')">
                <Space align="start" spacing="medium" style={titleStyle} vertical>
                    <img alt="semi_logo" src={logo} style="width: 87px; height: 31px" />
                    <Typography.Title heading={2} style={colorStyle}>{item.title}</Typography.Title>
                    <Space align="start" vertical>
                        <Typography.Paragraph style={colorStyle}>{item.lines[0]}</Typography.Paragraph>
                        <Typography.Paragraph style={colorStyle}>{item.lines[1]}</Typography.Paragraph>
                    </Space>
                </Space>
            </div>
        {/snippet}
    </Carousel>
</div>
