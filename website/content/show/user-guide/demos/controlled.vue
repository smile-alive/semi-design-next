<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Space, Switch, Tag, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const current = ref(0);
    const steps: UserGuideStepItem[] = [
        {
            target: () => document.querySelector('#controlled-demo-1'),
            title: '新手引导',
            description: 'Hello ByteDancer!',
            position: 'bottom',
        },
        {
            target: () => document.querySelector('#controlled-demo-2'),
            title: 'Switch',
            description: 'This is a Semi Switch',
            position: 'bottom',
        },
        {
            target: () => document.querySelector('#controlled-demo-3'),
            title: 'Button',
            description: 'This is a Semi Button',
            position: 'bottom',
        },
    ];

    const finish = (message: string) => {
        current.value = 0;
        console.log(message);
    };
</script>

<template>
    <div>
        <Button @click="visible = true">开始引导</Button>
        <br />
        <br />
        <Space>
            <Switch id="controlled-demo-1" aria-label="示例开关" defaultChecked />
            <Tag id="controlled-demo-2"> Default Tag </Tag>
            <Button id="controlled-demo-3">确定</Button>
        </Space>
        <UserGuide v-model:current="current" v-model:visible="visible" mask mode="popup" :steps="steps" @finish="finish('引导完成')" @skip="finish('跳过引导')" />
    </div>
</template>
