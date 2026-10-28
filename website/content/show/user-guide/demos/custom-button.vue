<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Space, Switch, Tag, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const steps: UserGuideStepItem[] = [
        {
            target: () => document.querySelector('#button-demo-1'),
            title: '新手引导',
            description: 'Hello ByteDancer!',
        },
        {
            target: () => document.querySelector('#button-demo-2'),
            title: 'New Button Style',
            description: 'Button text is Next',
        },
        {
            target: () => document.querySelector('#button-demo-3'),
            title: 'New finish button text',
            description: 'Button text is I know',
        },
    ];
</script>

<template>
    <div>
        <Button @click="visible = true">开始引导</Button>
        <br />
        <br />
        <Space>
            <Switch id="button-demo-1" aria-label="示例开关" defaultChecked />
            <Tag id="button-demo-2"> Default Tag </Tag>
            <Button id="button-demo-3">确定</Button>
        </Space>
        <UserGuide v-model:visible="visible" finishText="我知道啦！" mask mode="popup" :prevButtonProps="{ theme: 'borderless' }" :steps="steps" @finish="console.log('引导完成')" @skip="console.log('跳过引导')">
            <template #nextText>Next</template>
            <template #prevText>Prev</template>
        </UserGuide>
    </div>
</template>
