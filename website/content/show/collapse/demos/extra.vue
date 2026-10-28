<script setup lang="ts">
    import { IconCopy } from '@fibrae/semi-icons-vue';
    import { Collapse, Tag } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Collapse>
        <Collapse.Panel itemKey="1">
            <template #header>This is panel header 1</template>
            <template #extra>1234</template>
            <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
        </Collapse.Panel>
        <Collapse.Panel itemKey="2">
            <template #header>This is panel header 2</template>
            <template #extra>
                <IconCopy />
            </template>
            <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
        </Collapse.Panel>
        <Collapse.Panel itemKey="3">
            <template #header>This is panel header 3</template>
            <template #extra>
                <Tag color="violet" :style="{ margin: 0 }">Recommended</Tag>
            </template>
            <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
        </Collapse.Panel>
    </Collapse>
</template>
