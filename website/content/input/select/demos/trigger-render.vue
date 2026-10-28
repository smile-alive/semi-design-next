<script setup lang="ts">
    import { ref } from 'vue';
    import { IconAppCenter, IconChevronDown } from '@fibrae/semi-icons-vue';
    import { Select, Tag } from '@fibrae/semi-ui-vue';

    const valList = ref(['douyin', 'ulikecam']);
    const list = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'toutiao', label: '今日头条' },
    ];
</script>

<template>
    <div>
        <h4>不同背景色的触发器</h4>
        <Select v-model="valList" aria-label="不同背景色的触发器" filter multiple :optionList="list" searchPosition="dropdown" :style="{ width: '240px' }">
            <template #trigger="{ value }">
                <div
                    :style="{
                        minWidth: '112px',
                        backgroundColor: 'var(--semi-color-primary-light-default)',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '12px',
                        borderRadius: '3px',
                        color: 'var(--semi-color-primary)',
                    }"
                >
                    <div :style="{ fontWeight: 600, flexShrink: 0, fontSize: '14px' }">业务线</div>
                    <div
                        :style="{
                            margin: '4px',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            flexGrow: 1,
                            overflow: 'hidden',
                        }"
                    >
                        {{ value.map((item) => item.label).join(' , ') }}
                    </div>
                    <IconAppCenter :style="{ marginRight: '8px', flexShrink: 0 }" />
                </div>
            </template>
        </Select>
        <br />
        <br />
        <h4>使用 circle Tag 作为触发器</h4>
        <Select v-model="valList" aria-label="circle Tag 触发器" filter multiple :optionList="list" searchPosition="dropdown" :style="{ width: '240px', marginTop: '20px', outline: 0 }">
            <template #trigger="{ value }">
                <div
                    :style="{
                        margin: '4px',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        flexGrow: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                    }"
                >
                    <Tag color="cyan" shape="circle" size="large">
                        {{ value.map((item) => item.label).join(' / ') }}
                        <template #suffixIcon>
                            <IconChevronDown />
                        </template>
                    </Tag>
                </div>
            </template>
        </Select>
    </div>
</template>
