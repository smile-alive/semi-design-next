<script setup lang="ts">
    import { ref } from 'vue';
    import { Carousel, Radio, RadioGroup, Space, Typography, type CarouselProps, type RadioValue } from '@fibrae/semi-ui-vue';

    const { Title, Paragraph } = Typography;

    const arrowType = ref<CarouselProps['arrowType']>('always');
    const visibility = ref<'show' | 'hide'>('show');
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
    const titleStyle = { position: 'absolute', top: '100px', left: '100px' } as const;
    const colorStyle = { color: '#1C1F23' };

    const changeVisibility = (value: RadioValue | undefined) => {
        if (value === 'show' || value === 'hide') visibility.value = value;
    };
    const changeArrowType = (value: RadioValue | undefined) => {
        if (value === 'always' || value === 'hover') arrowType.value = value;
    };
</script>

<template>
    <div>
        <Carousel :arrowType="arrowType" :autoPlay="false" :showArrow="visibility === 'show'" :style="{ width: '100%', height: '400px' }" theme="dark">
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
                <div>展示箭头</div>
                <RadioGroup :modelValue="visibility" type="button" @update:modelValue="changeVisibility">
                    <Radio value="show">show</Radio>
                    <Radio value="hide">hide</Radio>
                </RadioGroup>
            </Space>
            <Space>
                <div>展示时机</div>
                <RadioGroup :modelValue="arrowType" type="button" @update:modelValue="changeArrowType">
                    <Radio value="always">always</Radio>
                    <Radio value="hover">hover</Radio>
                </RadioGroup>
            </Space>
        </Space>
    </div>
</template>
