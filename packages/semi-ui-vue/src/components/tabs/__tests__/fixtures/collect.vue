<script setup lang="ts">
    import Tabs, { TabPane } from '../..';
    import WrappedPane from './wrapped-pane.vue';

    const props = defineProps<{ keys?: string[]; extra?: boolean }>();
</script>

<template>
    <Tabs>
        <TabPane closable itemKey="kebab"><template #tab>烤串</template>kebab content</TabPane>
        <TabPane disabled itemKey="off"><template #tab>禁用</template>off content</TabPane>
        <TabPane :disabled="false" itemKey="on"><template #tab>启用</template>on content</TabPane>
        <TabPane v-for="key in props.keys ?? []" :key="key" :itemKey="key">
            <template #tab>{{ `项 ${key}` }}</template>
            {{ `内容 ${key}` }}
        </TabPane>
        <template v-for="key in props.keys ?? []" :key="key">
            <TabPane :itemKey="`group-${key}`">
                <template #tab>{{ `分组 ${key}` }}</template>
            </TabPane>
        </template>
        <TabPane v-if="props.extra" itemKey="extra"><template #tab>额外</template>extra content</TabPane>
        <div class="loose">loose div</div>
        loose text
        <WrappedPane />
    </Tabs>
</template>
