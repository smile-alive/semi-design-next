<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Radio, RadioGroup, SideSheet, type RadioValue, type SideSheetProps } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const placement = ref<RadioValue | undefined>('right');
</script>

<template>
    <RadioGroup v-model="placement" aria-label="侧边栏位置">
        <Radio value="right">right</Radio>
        <Radio value="left">left</Radio>
        <Radio value="top">top</Radio>
        <Radio value="bottom">bottom</Radio>
    </RadioGroup>
    <br />
    <br />
    <Button @click="visible = !visible">Open SideSheet</Button>
    <SideSheet v-model:visible="visible" :placement="placement as SideSheetProps['placement']" title="滑动侧边栏">
        <p>This is the content of a basic sidesheet.</p>
        <p>Here is more content...</p>
    </SideSheet>
</template>
