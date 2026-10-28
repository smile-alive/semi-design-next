<script setup lang="ts">
    import { Cascader, Checkbox, Typography, type Ellipsis } from '@fibrae/semi-ui-vue';

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
    const ellipsis: Ellipsis = { showTooltip: { opts: { style: { wordBreak: 'break-all' } } } };
</script>

<template>
    <Cascader filterTreeNode multiple placeholder="输入 通用 or 场景 进行搜索" style="width: 320px" :treeData="treeData" :virtualizeInSearch="virtualize">
        <template #filterItem="{ class: className, data, onCheck, checkStatus }">
            <div :class="className" :style="{ justifyContent: 'start', padding: '8px 16px 8px 12px', boxSizing: 'border-box' }">
                <Checkbox :indeterminate="checkStatus.halfChecked" :modelValue="checkStatus.checked" :style="{ marginRight: '8px' }" @change="onCheck" />
                <Typography.Text :ellipsis="ellipsis" :style="{ maxWidth: '260px' }">
                    {{ data.map((item) => item.label).join(' | ') }}
                </Typography.Text>
            </div>
        </template>
    </Cascader>
</template>
