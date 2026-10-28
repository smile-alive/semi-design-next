<script setup lang="ts">
    import { ref } from 'vue';
    import { Switch, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-vue';

    const showFilteredOnly = ref(false);

    const treeData: TreeNodeData[] = [
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
                        { label: 'Beijing', value: 'Beijing', key: '0-0-0' },
                        { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
                    ],
                },
                {
                    label: 'Japan',
                    value: 'Japan',
                    key: '0-1',
                    children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }],
                },
            ],
        },
        {
            label: 'North America',
            value: 'North America',
            key: '1',
            children: [
                { label: 'United States', value: 'United States', key: '1-0' },
                { label: 'Canada', value: 'Canada', key: '1-1' },
            ],
        },
    ];

    const dropdownStyle = { maxHeight: '400px', overflow: 'auto' };

    function onSearch(inputValue: string, filteredExpandedKeys: string[], filteredNodes: TreeNodeData[]) {
        console.log('onSearch', inputValue, filteredExpandedKeys, filteredNodes);
    }
</script>

<template>
    <span id="treeselect-searchable-filtered-only">showFilteredOnly</span>
    <Switch v-model="showFilteredOnly" aria-labelledby="treeselect-searchable-filtered-only" size="small" />
    <br />
    <br />
    <TreeSelect :dropdownStyle="dropdownStyle" filterTreeNode placeholder="单选可搜索的" :showFilteredOnly="showFilteredOnly" style="width: 300px" :treeData="treeData" @search="onSearch" />
    <br />
    <br />
    <TreeSelect :dropdownStyle="dropdownStyle" filterTreeNode :maxTagCount="2" multiple placeholder="多选可搜索的" searchPlaceholder="请输入关键字开始搜索" :showFilteredOnly="showFilteredOnly" style="width: 300px" :treeData="treeData" @search="onSearch" />
    <br />
    <br />
    <TreeSelect :dropdownStyle="dropdownStyle" filterTreeNode :maxTagCount="2" multiple placeholder="搜索框autofocus" searchAutoFocus searchPlaceholder="autofocus" :showFilteredOnly="showFilteredOnly" style="width: 300px" :treeData="treeData" @search="onSearch" />
</template>
