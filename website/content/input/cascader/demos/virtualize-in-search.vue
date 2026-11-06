<script setup lang="ts">
    import { Cascader, Checkbox, Typography } from '@fibrae/semi-ui-vue';

    const treeData = ['通用', '场景'].map((label, m) => ({
        label,
        value: m,
        children: Array.from({ length: 100 }, (_item, n) => ({
            value: `${m}-${n}`,
            label: `${m}-${n} 第二级`,
            children: Array.from({ length: 20 }, (_item, o) => ({
                value: `${m}-${n}-${o}`,
                label: `${m}-${n}-${o} 第三级详细内容`,
            })),
        })),
    }));

    const virtualize = {
        // Height = default panel 180px minus 2 * 8px padding
        height: 172,
        width: 320,
        itemSize: 36,
    };
</script>

<template>
    <Cascader filterTreeNode multiple placeholder="输入 通用 or 场景 进行搜索" style="width: 320px" :treeData="treeData" :virtualizeInSearch="virtualize">
        <template #filterItem="item">
            <div :class="item.class" :style="{ justifyContent: 'start', padding: '8px 16px 8px 12px', boxSizing: 'border-box' }">
                <Checkbox :indeterminate="item.checkStatus.halfChecked" :modelValue="item.checkStatus.checked" :style="{ marginInlineEnd: '8px' }" @change="item.onCheck" />
                <Typography.Text :ellipsis="{ showTooltip: { opts: { style: { wordBreak: 'break-all' } } } }" :style="{ maxWidth: '260px' }">
                    {{ item.data.map((option) => option.label).join(' | ') }}
                </Typography.Text>
            </div>
        </template>
    </Cascader>
</template>
