<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { Annotation, type AnnotationInfo, type AnnotationItem } from '@fibrae/semi-ai-vue';
    import { Button } from '@fibrae/semi-ui-vue';

    const containerStyle = {
        display: 'flex',
        height: '500px',
        border: '1px solid var(--semi-color-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxSizing: 'border-box',
    } as const;

    const logo = '/assets/placeholder/avatar-a.svg';
    const img = '/assets/root-web-sites/abstract.jpg';

    const defaultInfoList: AnnotationInfo[] = [
        {
            header: 'Semi design introduction',
            key: '1',
            annotations: [
                {
                    order: 1,
                    type: 'video',
                    duration: 4432,
                    title: 'Semi Design is a design system designed',
                    url: 'https://semi.design/',
                    logo,
                    siteName: 'Semi Design',
                    detail: ' As a comprehensive, easy-to-use, and high-quality modern enterprise-level application UI solution',
                    img,
                },
                {
                    order: 2,
                    title: 'Quick start',
                    type: 'video',
                    duration: 56,
                    url: 'https://semi.design/',
                    detail: ' As a comprehensive, easy-to-use, and high-quality modern enterprise-level application UI solution',
                    logo,
                    siteName: 'Semi Design',
                    img,
                },
                {
                    order: 3,
                    title: 'Use components in a modular way',
                    url: 'https://semi.design/',
                    detail: `Semi provides esm format dist, and the css of the component is only imported by the corresponding js.
When used in Webpack, Rspack, create-react-app or Vite projects, there is no need to configure any compilation items.`,
                    logo,
                    siteName: 'Semi Design',
                    img,
                },
            ],
        },
        {
            header: 'Design resource',
            key: '2',
            annotations: [
                {
                    order: 2,
                    title: 'Semi Design resource',
                    url: 'https://semi.design/',
                    detail: 'Semi Design provides a wealth of design resources to help designers and developers collaborate efficiently. Whether you are a community user or a ByteDance internal designer, you can find UI Kit resource and Figma plug-ins that suit you here.',
                    logo,
                    siteName: 'Semi Design resource',
                    img,
                },
            ],
        },
    ];

    const defaultSize = { width: 420 };
    const visible = shallowRef(true);
    const activeKey = shallowRef<string | string[]>('1');

    const onChange = (key: string | string[]) => {
        console.log('change', key);
    };

    const onClick = (event: MouseEvent, item: AnnotationItem) => {
        console.log('click', event, item);
    };
</script>

<template>
    <div :style="containerStyle">
        <div :style="{ flexGrow: 1, flexShrink: 1, padding: '20px' }">
            <Button :aria-pressed="visible" @click="visible = !visible">参考来源</Button>
        </div>
        <Annotation v-model:activeKey="activeKey" v-model:visible="visible" :defaultSize="defaultSize" :info="defaultInfoList" @change="onChange" @click="onClick" />
    </div>
</template>
