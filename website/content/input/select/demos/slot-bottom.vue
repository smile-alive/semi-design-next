<script setup lang="ts">
    import { Select, SelectOption } from '@fibrae/semi-ui-vue';

    const innerSlotStyle = {
        backgroundColor: 'var(--color-white)',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        paddingLeft: '32px',
        borderTop: '1px solid var(--semi-color-border)',
        borderRadius: '0 0 6px 6px',
        color: 'var(--semi-color-link)',
    };
    const outSlotStyle = {
        backgroundColor: 'var(--semi-color-fill-0)',
        height: '36px',
        display: 'flex',
        paddingLeft: '32px',
        color: 'var(--semi-color-link)',
        alignItems: 'center',
        cursor: 'pointer',
        borderTop: '1px solid var(--semi-color-border)',
        borderRadius: '0 0 6px 6px',
    };
</script>

<template>
    <div>
        <p>outerBottomSlot:</p>
        <Select aria-label="outerBottomSlot" :autoAdjustOverflow="false" defaultOpen :dropdownStyle="{ width: '180px' }" :maxHeight="150" placeholder="自定义外侧底部slot，始终显示" position="bottom" :style="{ width: '300px' }">
            <SelectOption value="douyin">抖音</SelectOption>
            <SelectOption value="ulikecam">轻颜相机</SelectOption>
            <SelectOption value="jianying">剪映</SelectOption>
            <SelectOption value="duoshan">多闪</SelectOption>
            <SelectOption value="xigua">西瓜视频</SelectOption>
            <template #outerBottomSlot>
                <div :style="outSlotStyle">
                    <span :style="{ color: 'var(--semi-color-link)' }">未找到应用?</span>
                </div>
            </template>
        </Select>
        <p :style="{ marginTop: '200px' }">innerBottomSlot:</p>
        <Select aria-label="innerBottomSlot" :dropdownStyle="{ width: '180px' }" :maxHeight="150" placeholder="自定义内侧底部slot，滚动至底部显示" :style="{ width: '300px' }">
            <SelectOption value="douyin">抖音</SelectOption>
            <SelectOption value="ulikecam">轻颜相机</SelectOption>
            <SelectOption value="jianying">剪映</SelectOption>
            <SelectOption value="duoshan">多闪</SelectOption>
            <SelectOption value="xigua">西瓜视频</SelectOption>
            <template #innerBottomSlot>
                <div :style="innerSlotStyle">点击加载更多</div>
            </template>
        </Select>
    </div>
</template>
