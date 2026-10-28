<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const target = () => document.querySelector('#position-demo');
    const steps: UserGuideStepItem[] = [
        { target, title: '新手引导', description: 'Hello ByteDancer!', position: 'top' },
        { target, title: 'New Position', description: 'This is Right Position', position: 'right' },
        { target, title: 'Hide Arrow', description: 'We hide the arrow', position: 'bottom', showArrow: false },
    ];
</script>

<template>
    <div>
        <Button id="position-demo" @click="visible = true">开始引导</Button>
        <UserGuide v-model:visible="visible" mask mode="popup" :steps="steps" @finish="console.log('引导完成')" @skip="console.log('跳过引导')" />
    </div>
</template>
