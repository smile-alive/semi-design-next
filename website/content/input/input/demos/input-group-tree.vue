<script setup lang="ts">
    import { Cascader, InputGroup, Select, TreeSelect } from '@fibrae/semi-ui-vue';

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
</script>

<template>
    <InputGroup>
        <Select aria-label="From or to" defaultValue="from" :style="{ width: '100px' }">
            <Select.Option value="from">From: </Select.Option>
            <Select.Option value="to">To: </Select.Option>
        </Select>
        <TreeSelect placeholder="Please select" :style="{ width: '220px' }" :treeData="treeData" />
    </InputGroup>
    <br />
    <br />
    <InputGroup>
        <Select aria-label="From or to" defaultValue="from" :style="{ width: '100px' }">
            <Select.Option value="from">From: </Select.Option>
            <Select.Option value="to">To: </Select.Option>
        </Select>
        <Cascader placeholder="Please select" :style="{ width: '220px' }" :treeData="treeData" />
    </InputGroup>
</template>
