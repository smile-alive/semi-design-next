<script setup lang="ts">
    import { IconChevronDown, IconClose } from '@fibrae/semi-icons-vue';
    import { Button, ButtonGroup, Cascader, Tag, TagInput, type CascaderData } from '@fibrae/semi-ui-vue';

    const treeData: CascaderData[] = [
        {
            label: '浙江省',
            value: 'zhejiang',
            children: [
                {
                    label: '杭州市',
                    value: 'hangzhou',
                    children: [
                        { label: '西湖区', value: 'xihu' },
                        { label: '萧山区', value: 'xiaoshan' },
                        { label: '临安区', value: 'linan' },
                    ],
                },
                {
                    label: '宁波市',
                    value: 'ningbo',
                    children: [
                        { label: '海曙区', value: 'haishu' },
                        { label: '江北区', value: 'jiangbei' },
                    ],
                },
            ],
        },
    ];

    const getLabelFromValue = (value: string) => {
        const [first, ...rest] = value.split('-').map((item) => Number(item));
        let node: CascaderData | undefined = treeData[first];
        rest.forEach((item) => {
            node = node?.children?.[item];
        });
        return node?.label;
    };
</script>

<template>
    <Cascader placeholder="Custom Trigger" :treeData="treeData">
        <template #trigger="{ value, placeholder, onClear }">
            <!-- The clear button is a sibling of the trigger button: buttons cannot nest -->
            <ButtonGroup theme="light">
                <Button iconPosition="right">
                    <template #icon>
                        <IconChevronDown />
                    </template>
                    {{ value ? getLabelFromValue(value) : placeholder }}
                </Button>
                <Button v-if="value" aria-label="清除" @click.stop="onClear($event)">
                    <template #icon>
                        <IconClose />
                    </template>
                </Button>
            </ButtonGroup>
        </template>
    </Cascader>
    <br />
    <Cascader filterTreeNode multiple placeholder="Custom Trigger" style="width: 300px" :treeData="treeData">
        <template #trigger="{ value, onSearch, onRemove }">
            <TagInput :modelValue="Array.from(value)" @inputChange="onSearch">
                <template #tag="{ value: pos }">
                    <Tag closable :style="{ marginLeft: '2px' }" :tagKey="pos" @close="onRemove(pos)">
                        {{ getLabelFromValue(pos) }}
                    </Tag>
                </template>
            </TagInput>
        </template>
    </Cascader>
</template>
