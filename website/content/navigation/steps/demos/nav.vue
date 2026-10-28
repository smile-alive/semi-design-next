<script setup lang="ts">
    import { Steps } from '@fibrae/semi-ui-vue';

    const log = (i: number) => console.log(i);
</script>

<template>
    <div :style="{ display: 'flex', justifyContent: 'center' }">
        <Steps :current="1" :style="{ margin: 'auto' }" type="nav" @change="log">
            <Steps.Step>
                <template #title>注册账号</template>
            </Steps.Step>
            <Steps.Step>
                <template #title>这个项目的文字比较多多多多</template>
            </Steps.Step>
            <Steps.Step>
                <template #title>产品用途</template>
            </Steps.Step>
            <Steps.Step>
                <template #title>期待尝试功能</template>
            </Steps.Step>
        </Steps>
    </div>
</template>
