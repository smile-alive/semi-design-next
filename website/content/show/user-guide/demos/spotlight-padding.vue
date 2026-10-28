<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Space, Switch, Tag, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const steps: UserGuideStepItem[] = [
        {
            target: () => document.querySelector('#padding-demo-1'),
            title: '新手引导',
            description: 'Hello ByteDancer!',
        },
        {
            target: () => document.querySelector('#padding-demo-2'),
            title: 'New Padding',
            description: 'This is 10px padding',
        },
        {
            target: () => document.querySelector('#padding-demo-3'),
            title: 'Change Padding',
            spotlightPadding: 15,
            description: 'We change the Padding to 15px',
        },
    ];
</script>

<template>
    <div>
        <Button @click="visible = true">开始引导</Button>
        <br />
        <br />
        <Space>
            <Switch id="padding-demo-1" aria-label="示例开关" defaultChecked />
            <Tag id="padding-demo-2"> Default Tag </Tag>
            <Button id="padding-demo-3">确定</Button>
        </Space>
        <UserGuide v-model:visible="visible" mask mode="popup" :spotlightPadding="10" :steps="steps" @finish="console.log('引导完成')" @skip="console.log('跳过引导')" />
    </div>
</template>
