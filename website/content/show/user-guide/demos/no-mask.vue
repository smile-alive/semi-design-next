<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const steps: UserGuideStepItem[] = [
        {
            target: () => document.querySelector('#mask-demo'),
            title: 'No Mask',
            description: 'Hello ByteDancer!',
        },
    ];
</script>

<template>
    <div>
        <Button id="mask-demo" @click="visible = true">开始引导</Button>
        <UserGuide v-model:visible="visible" :mask="false" mode="popup" :steps="steps" @finish="console.log('引导完成')" @skip="console.log('跳过引导')" />
    </div>
</template>
