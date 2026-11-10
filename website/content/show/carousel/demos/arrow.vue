<script setup lang="ts">
    import { ref } from 'vue';
    import { Carousel, Radio, RadioGroup, Space, Typography, type CarouselProps, type RadioValue } from '@fibrae/semi-ui-vue';

    const arrowType = ref<CarouselProps['arrowType']>('always');
    const show = ref(true);
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
    const titleStyle = { position: 'absolute', top: '100px', left: '100px' } as const;
    const colorStyle = { color: '#1C1F23' };

    const changeShow = (value?: RadioValue) => {
        if (typeof value === 'boolean') show.value = value;
    };
    const changeArrowType = (value?: RadioValue) => {
        if (value === 'always' || value === 'hover') arrowType.value = value;
    };
</script>

<template>
    <div>
        <Carousel :arrowType="arrowType" :autoPlay="false" :showArrow="show" :style="{ width: '100%', height: '400px' }" theme="dark">
            <div v-for="slide in slides" :key="slide.src" :style="{ height: '100%', backgroundSize: 'cover', backgroundImage: `url('${slide.src}')` }">
                <Space align="start" spacing="medium" :style="titleStyle" vertical>
                    <img alt="semi_logo" :src="logo" :style="{ width: '87px', height: '31px' }" />
                    <Typography.Title :heading="2" :style="colorStyle">{{ slide.title }}</Typography.Title>
                    <Space align="start" vertical>
                        <Typography.Paragraph :style="colorStyle">{{ slide.lines[0] }}</Typography.Paragraph>
                        <Typography.Paragraph :style="colorStyle">{{ slide.lines[1] }}</Typography.Paragraph>
                    </Space>
                </Space>
            </div>
        </Carousel>
        <br />
        <Space align="start" vertical>
            <Space>
                <div>展示箭头</div>
                <RadioGroup aria-label="展示箭头" :modelValue="show" type="button" @update:modelValue="changeShow">
                    <Radio value>show</Radio>
                    <Radio :value="false">hide</Radio>
                </RadioGroup>
            </Space>
            <Space>
                <div>展示时机</div>
                <RadioGroup aria-label="展示时机" :modelValue="arrowType" type="button" @update:modelValue="changeArrowType">
                    <Radio value="always">always</Radio>
                    <Radio value="hover">hover</Radio>
                </RadioGroup>
            </Space>
        </Space>
    </div>
</template>
