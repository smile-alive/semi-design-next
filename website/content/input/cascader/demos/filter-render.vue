<script setup lang="ts">
    import { Cascader, Checkbox, TypographyText, type CascaderData, type Ellipsis } from '@fibrae/semi-ui-vue';

    const treeData = [
        {
            label: 'Semi',
            value: 'Semi',
            children: [
                {
                    label: 'Semi-Material Semi-Material Semi-Material Semi-Material',
                    value: 'Semi-Material',
                },
                {
                    label: 'Semi-DSM Semi-DSM Semi-DSM Semi-DSM',
                    value: 'Semi-DSM',
                },
                {
                    label: 'Semi Design Semi Design Semi Design Semi Design',
                    value: 'Semi',
                },
                {
                    label: 'Semi-C2D Semi-C2D Semi-C2D Semi-C2D Semi-C2D',
                    value: 'Semi-C2D',
                },
                {
                    label: 'Semi-D2C Semi-D2C Semi-D2C Semi-D2C Semi-D2C ',
                    value: 'Semi-D2C',
                },
            ],
        },
    ];
    const ellipsis: Ellipsis = { showTooltip: { opts: { style: { wordBreak: 'break-all' } } } };
    const pathLabel = (data: CascaderData[]) => data.map((item) => item.label).join(' / ');
</script>

<template>
    <div>
        <p>鼠标 hover 到选项可查看被省略文本完整内容</p>
        <br />
        <Cascader filterTreeNode placeholder="单选，输入 s 自定义搜索选项渲染结果" :style="{ width: '320px' }" :treeData="treeData">
            <template #filterItem="{ class: className, data, onClick, selected }">
                <li :aria-selected="selected" :class="className" role="option" :style="{ justifyContent: 'flex-start' }" @click="onClick">
                    <TypographyText :ellipsis="ellipsis" :style="{ width: '270px', color: selected ? 'var(--semi-color-primary)' : undefined }">
                        {{ pathLabel(data) }}
                    </TypographyText>
                </li>
            </template>
        </Cascader>
        <br />
        <Cascader filterTreeNode multiple placeholder="多选，输入 s 自定义搜索选项渲染结果" :style="{ width: '320px', marginTop: '20px' }" :treeData="treeData">
            <template #filterItem="{ class: className, data, checkStatus, onCheck }">
                <li :aria-label="pathLabel(data)" :aria-selected="checkStatus.checked" :class="className" role="option" :style="{ justifyContent: 'flex-start' }">
                    <Checkbox :indeterminate="checkStatus.halfChecked" :modelValue="checkStatus.checked" :tabIndex="-1" @change="onCheck">
                        <TypographyText :ellipsis="ellipsis" :style="{ width: '250px' }">
                            {{ pathLabel(data) }}
                        </TypographyText>
                    </Checkbox>
                </li>
            </template>
        </Cascader>
    </div>
</template>
