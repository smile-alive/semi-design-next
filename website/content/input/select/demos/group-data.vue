<script setup lang="ts">
    import { Select } from '@fibrae/semi-ui-vue';

    const data = [
        {
            label: 'Asia',
            children: [
                { value: 'a-1', label: 'China' },
                { value: 'a-2', label: 'Korea' },
            ],
        },
        {
            label: 'Europe',
            children: [
                { value: 'b-1', label: 'Germany' },
                { value: 'b-2', label: 'France' },
            ],
        },
        {
            label: 'South America',
            children: [{ value: 'c-1', label: 'Peru' }],
        },
    ];
</script>

<template>
    <Select aria-label="地区" filter placeholder="" style="width: 180px">
        <Select.OptGroup v-for="group in data" :key="group.label" :label="group.label">
            <Select.Option v-for="option in group.children" :key="option.value" :label="option.label" :value="option.value" />
        </Select.OptGroup>
    </Select>
</template>
