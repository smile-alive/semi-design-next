<script setup lang="ts">
    import { Steps } from '@fibrae/semi-ui-vue';

    const log = (i: number) => console.log(i);
</script>

<template>
    <Steps :current="1" size="small" type="basic" @change="log">
        <Steps.Step>
            <template #title>Finished</template>
            <template #description>This is a description</template>
        </Steps.Step>
        <Steps.Step>
            <template #title>In Progress</template>
            <template #description>This is a description</template>
        </Steps.Step>
        <Steps.Step>
            <template #title>Waiting</template>
            <template #description>This is a description</template>
        </Steps.Step>
    </Steps>
</template>
