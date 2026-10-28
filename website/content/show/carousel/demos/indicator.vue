<script setup lang="ts">
    import { ref } from 'vue';
    import { Carousel, Radio, RadioGroup, Space, Typography, type CarouselProps, type RadioValue } from '@fibrae/semi-ui-vue';

    const { Title, Paragraph } = Typography;

    const size = ref<CarouselProps['indicatorSize']>('small');
    const type = ref<CarouselProps['indicatorType']>('dot');
    const position = ref<CarouselProps['indicatorPosition']>('left');
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
    const titleStyle = { position: 'absolute', top: '100px', left: '100px' } as const;
    const colorStyle = { color: '#1C1F23' };

    const changeType = (value: RadioValue | undefined) => {
        if (value === 'dot' || value === 'line' || value === 'columnar') type.value = value;
    };
    const changePosition = (value: RadioValue | undefined) => {
        if (value === 'left' || value === 'center' || value === 'right') position.value = value;
    };
    const changeSize = (value: RadioValue | undefined) => {
        if (value === 'small' || value === 'medium') size.value = value;
    };
</script>

<template>
    <div>
        <Carousel :autoPlay="false" :indicatorPosition="position" :indicatorSize="size" :indicatorType="type" :style="{ width: '100%', height: '400px' }" theme="dark">
            <div v-for="slide in slides" :key="slide.src" :style="{ backgroundSize: 'cover', backgroundImage: `url('${slide.src}')` }">
                <Space align="start" spacing="medium" :style="titleStyle" vertical>
                    <img alt="semi_logo" :src="logo" :style="{ width: '87px', height: '31px' }" />
                    <Title :heading="2" :style="colorStyle">{{ slide.title }}</Title>
                    <Space align="start" vertical>
                        <Paragraph v-for="line in slide.lines" :key="line" :style="colorStyle">{{ line }}</Paragraph>
                    </Space>
                </Space>
            </div>
        </Carousel>
        <br />
        <Space align="start" vertical>
            <Space>
                <div>类型</div>
                <RadioGroup :modelValue="type" type="button" @update:modelValue="changeType">
                    <Radio value="dot">dot</Radio>
                    <Radio value="line">line</Radio>
                    <Radio value="columnar">columnar</Radio>
                </RadioGroup>
            </Space>
            <Space>
                <div>位置</div>
                <RadioGroup :modelValue="position" type="button" @update:modelValue="changePosition">
                    <Radio value="left">left</Radio>
                    <Radio value="center">center</Radio>
                    <Radio value="right">right</Radio>
                </RadioGroup>
            </Space>
            <Space>
                <div>尺寸</div>
                <RadioGroup :modelValue="size" type="button" @update:modelValue="changeSize">
                    <Radio value="small">small</Radio>
                    <Radio value="medium">medium</Radio>
                </RadioGroup>
            </Space>
        </Space>
    </div>
</template>
