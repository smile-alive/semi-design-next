<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Radio, RadioGroup, SideSheet, type RadioValue, type SideSheetProps } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const size = ref<RadioValue | undefined>('small');
</script>

<template>
    <RadioGroup v-model="size" aria-label="侧边栏尺寸">
        <Radio value="small">small</Radio>
        <Radio value="medium">medium</Radio>
        <Radio value="large">large</Radio>
    </RadioGroup>
    <br />
    <br />
    <Button @click="visible = !visible">Open SideSheet</Button>
    <SideSheet v-model:visible="visible" :size="size as SideSheetProps['size']" title="滑动侧边栏">
        <p>This is the content of a basic sidesheet.</p>
        <p>Here is more content...</p>
    </SideSheet>
</template>
