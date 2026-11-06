<script setup lang="ts">
    import { ref } from 'vue';
    import { Resizable, Switch, Typography } from '@fibrae/semi-ui-vue';

    const enabled = ref(false);
</script>

<template>
    <div :style="{ width: '500px', height: '60%' }">
        <div :style="{ display: 'flex', alignItems: 'center', margin: '8px' }">
            <Switch v-model="enabled" aria-labelledby="resizable-enable-state" />
            <Typography.Title id="resizable-enable-state" :heading="6" :style="{ margin: '8px' }">
                {{ enabled ? 'able' : 'disable' }}
            </Typography.Title>
        </div>
        <Resizable :defaultSize="{ width: 200, height: 200 }" :enable="{ left: enabled }" :style="{ backgroundColor: 'var(--semi-grey-1)' }">
            <div :style="{ marginInlineStart: '20%' }">{{ 'enable.left:' + enabled }}</div>
        </Resizable>
    </div>
</template>
