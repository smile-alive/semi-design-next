<script setup lang="ts">
    import { Checkbox, Tree } from '@fibrae/semi-ui-vue';

    const treeData = [
        {
            label: 'Asia',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: 'China',
                    value: 'China',
                    key: '0-0',
                    children: [
                        {
                            label: 'Beijing',
                            value: 'Beijing',
                            key: '0-0-0',
                        },
                        {
                            label: 'Shanghai',
                            value: 'Shanghai',
                            key: '0-0-1',
                        },
                    ],
                },
                {
                    label: 'Japan',
                    value: 'Japan',
                    key: '0-1',
                    children: [
                        {
                            label: 'Osaka',
                            value: 'Osaka',
                            key: '0-1-0',
                        },
                    ],
                },
            ],
        },
        {
            label: 'North America',
            value: 'North America',
            key: '1',
            children: [
                {
                    label: 'United States',
                    value: 'United States',
                    key: '1-0',
                },
                {
                    label: 'Canada',
                    value: 'Canada',
                    key: '1-1',
                },
            ],
        },
    ];

    const treeStyle = {
        width: '260px',
        height: '420px',
        border: '1px solid var(--semi-color-border)',
    };
</script>

<template>
    <Tree leafOnly multiple :style="treeStyle" :treeData="treeData">
        <!-- Focus stays on the tree (arrows expand, Enter/Space check), so the inline checkbox is display-only -->
        <template #fullLabel="row">
            <div :class="row.class" @click="row.data.children?.length ? row.onExpand($event) : row.onCheck($event)">
                <component :is="row.expandIcon" v-if="row.data.children?.length" />
                <Checkbox v-else aria-hidden="true" :indeterminate="row.checkStatus.halfChecked" :modelValue="row.checkStatus.checked" :style="{ marginRight: '8px' }" tabindex="-1" />
                <span>{{ row.data.label }}</span>
            </div>
        </template>
    </Tree>
</template>
