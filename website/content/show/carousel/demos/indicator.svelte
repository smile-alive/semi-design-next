<script lang="ts">
    import { Carousel, Radio, RadioGroup, Space, TypographyParagraph, TypographyTitle, type CarouselProps, type RadioValue } from '@fibrae/semi-ui-svelte';

    let size = $state<CarouselProps['indicatorSize']>('small');
    let type = $state<CarouselProps['indicatorType']>('dot');
    let position = $state<CarouselProps['indicatorPosition']>('left');
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
            lines: ['高效的 Design2Code 设计稿转代码', '海量 Figma前端代码一键转'],
        },
    ];
    const titleStyle = 'position: absolute; top: 100px; left: 100px';
    const colorStyle = 'color: #1C1F23';

    const changeType = (value: RadioValue | undefined) => {
        if (value === 'dot' || value === 'line' || value === 'columnar') type = value;
    };
    const changePosition = (value: RadioValue | undefined) => {
        if (value === 'left' || value === 'center' || value === 'right') position = value;
    };
    const changeSize = (value: RadioValue | undefined) => {
        if (value === 'small' || value === 'medium') size = value;
    };
</script>

<div>
    <Carousel autoPlay={false} indicatorPosition={position} indicatorSize={size} indicatorType={type} items={slides} style="width: 100%; height: 400px" theme="dark">
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
    <Space align="start" vertical>
        <Space>
            <div>类型</div>
            <RadioGroup aria-label="指示器类型" name="demo-carousel-indicator-type" onChange={(e) => changeType(e.target.value)} type="button" value={type}>
                <Radio value="dot">dot</Radio>
                <Radio value="line">line</Radio>
                <Radio value="columnar">columnar</Radio>
            </RadioGroup>
        </Space>
        <Space>
            <div>位置</div>
            <RadioGroup aria-label="指示器位置" name="demo-carousel-indicator-position" onChange={(e) => changePosition(e.target.value)} type="button" value={position}>
                <Radio value="left">left</Radio>
                <Radio value="center">center</Radio>
                <Radio value="right">right</Radio>
            </RadioGroup>
        </Space>
        <Space>
            <div>尺寸</div>
            <RadioGroup aria-label="指示器尺寸" name="demo-carousel-indicator-size" onChange={(e) => changeSize(e.target.value)} type="button" value={size}>
                <Radio value="small">small</Radio>
                <Radio value="medium">medium</Radio>
            </RadioGroup>
        </Space>
    </Space>
</div>
