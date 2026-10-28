<script setup lang="ts">
    import { Cascader, InputGroup, Select, SelectOption, TreeSelect } from '@fibrae/semi-ui-vue';

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
                        { label: 'Beijing', value: 'Beijing', key: '0-0-0' },
                        { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
                    ],
                },
            ],
        },
        { label: 'North America', value: 'North America', key: '1' },
    ];
    const selectStyle = { width: '100px' };
    const treeStyle = { width: '220px' };
</script>

<template>
    <InputGroup>
        <Select aria-label="From or to" defaultValue="from" :style="selectStyle">
            <SelectOption value="from">From: </SelectOption>
            <SelectOption value="to">To: </SelectOption>
        </Select>
        <TreeSelect placeholder="Please select" :style="treeStyle" :treeData="treeData" />
    </InputGroup>
    <br />
    <br />
    <InputGroup>
        <Select aria-label="From or to" defaultValue="from" :style="selectStyle">
            <SelectOption value="from">From: </SelectOption>
            <SelectOption value="to">To: </SelectOption>
        </Select>
        <Cascader placeholder="Please select" :style="treeStyle" :treeData="treeData" />
    </InputGroup>
</template>
