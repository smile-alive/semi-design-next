<script lang="ts">
    import { Carousel, Radio, RadioGroup, Space, TypographyParagraph, TypographyTitle, type CarouselProps, type RadioValue } from '@fibrae/semi-ui-svelte';

    let theme = $state<CarouselProps['theme']>('primary');
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
            lines: ['高效的 Design2Code 设计稿转代码', '海量 Figma 设计模板一键转为真实前端代码'],
        },
    ];
    const titleStyle = 'position: absolute; top: 100px; left: 100px';
    const colorStyle = 'color: #1C1F23';

    const changeTheme = (value: RadioValue | undefined) => {
        if (value === 'primary' || value === 'light' || value === 'dark') theme = value;
    };
</script>

<div>
    <Carousel autoPlay={false} items={slides} style="width: 100%; height: 400px" {theme}>
        {#snippet slide({ item })}
            <div style="height: 100%; background-size: cover; background-image: url('{item.src}')">
                <Space align="start" spacing="medium" style={titleStyle} vertical>
                    <img alt="semi_logo" src={logo} style="width: 87px; height: 31px" />
                    <TypographyTitle heading={2} style={colorStyle}>{item.title}</TypographyTitle>
                    <Space align="start" vertical>
                        {#each item.lines as line (line)}
                            <TypographyParagraph style={colorStyle}>{line}</TypographyParagraph>
                        {/each}
                    </Space>
                </Space>
            </div>
        {/snippet}
    </Carousel>
    <br />
    <Space>
        <div>主题</div>
        <RadioGroup aria-label="主题" name="demo-carousel-theme" onChange={(e) => changeTheme(e.target.value)} type="button" value={theme}>
            <Radio value="primary">primary</Radio>
            <Radio value="light">light</Radio>
            <Radio value="dark">dark</Radio>
        </RadioGroup>
    </Space>
</div>
