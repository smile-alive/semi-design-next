<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Space, Switch, Tag, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const steps: UserGuideStepItem[] = [
        {
            target: () => document.querySelector('#theme-demo-1'),
            title: '新手引导',
            description: 'Hello ByteDancer!',
            position: 'bottom',
        },
        {
            target: () => document.querySelector('#theme-demo-2'),
            title: 'Switch',
            description: 'This is a Semi Switch',
            position: 'bottom',
        },
        {
            target: () => document.querySelector('#theme-demo-3'),
            title: 'Button',
            description: 'This is a Semi Button',
            position: 'bottom',
        },
    ];
</script>

<template>
    <div>
        <Button @click="visible = true">开始引导</Button>
        <br />
        <br />
        <Space>
            <Switch id="theme-demo-1" aria-label="示例开关" defaultChecked />
            <Tag id="theme-demo-2"> Default Tag </Tag>
            <Button id="theme-demo-3">确定</Button>
        </Space>
        <UserGuide v-model:visible="visible" mask mode="popup" :steps="steps" theme="primary" @finish="console.log('引导完成')" @skip="console.log('跳过引导')" />
    </div>
</template>
