<script setup lang="ts">
    import Tabs, { TabPane } from '../..';

    interface Pane {
        itemKey: string;
        tab: string;
        content?: string;
        disabled?: boolean;
        closable?: boolean;
    }

    const props = defineProps<{ panes: Pane[] } & /* @vue-ignore */ InstanceType<typeof Tabs>['$props']>();
</script>

<template>
    <Tabs>
        <TabPane v-for="pane in props.panes" :key="pane.itemKey" :closable="pane.closable" :disabled="pane.disabled" :itemKey="pane.itemKey">
            <template #tab>{{ pane.tab }}</template>
            {{ pane.content }}
        </TabPane>
    </Tabs>
</template>
