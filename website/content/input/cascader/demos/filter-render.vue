<script setup lang="ts">
    import { Cascader, Checkbox, Typography } from '@fibrae/semi-ui-vue';

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
                    label: 'Semi-Theme Semi-Theme Semi-Theme Semi-Theme',
                    value: 'Semi-Theme',
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
                    label: 'Semi-Icons Semi-Icons Semi-Icons Semi-Icons Semi-Icons ',
                    value: 'Semi-Icons',
                },
            ],
        },
    ];
</script>

<template>
    <div>
        <p>鼠标 hover 到选项可查看被省略文本完整内容</p>
        <br />
        <Cascader filterTreeNode placeholder="单选，输入 s 自定义搜索选项渲染结果" :style="{ width: '320px' }" :treeData="treeData">
            <template #filterItem="item">
                <li :aria-selected="item.selected" :class="item.class" role="option" :style="{ justifyContent: 'flex-start' }" @click="item.onClick">
                    <Typography.Text :ellipsis="{ showTooltip: { opts: { style: { wordBreak: 'break-all' } } } }" :style="{ width: '270px', color: item.selected ? 'var(--semi-color-primary)' : undefined }">
                        {{ item.data.map((option) => option.label).join(' / ') }}
                    </Typography.Text>
                </li>
            </template>
        </Cascader>
        <br />
        <Cascader filterTreeNode multiple placeholder="多选，输入 s 自定义搜索选项渲染结果" :style="{ width: '320px', marginBlockStart: '20px' }" :treeData="treeData">
            <template #filterItem="item">
                <li :aria-label="item.data.map((option) => option.label).join(' / ')" :aria-selected="item.checkStatus.checked" :class="item.class" role="option" :style="{ justifyContent: 'flex-start' }">
                    <Checkbox :indeterminate="item.checkStatus.halfChecked" :modelValue="item.checkStatus.checked" :tabIndex="-1" @change="item.onCheck">
                        <Typography.Text :ellipsis="{ showTooltip: { opts: { style: { wordBreak: 'break-all' } } } }" :style="{ width: '250px' }">
                            {{ item.data.map((option) => option.label).join(' / ') }}
                        </Typography.Text>
                    </Checkbox>
                </li>
            </template>
        </Cascader>
    </div>
</template>
