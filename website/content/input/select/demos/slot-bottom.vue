<script setup lang="ts">
    import { Select } from '@fibrae/semi-ui-vue';

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
        <Select aria-label="outerBottomSlot" :autoAdjustOverflow="false" defaultOpen :maxHeight="150" placeholder="自定义外侧底部slot，始终显示" position="bottom" :style="{ width: '300px' }" :styles="{ dropdown: { width: '180px' } }">
            <Select.Option value="video">短视频</Select.Option>
            <Select.Option value="camera">相机</Select.Option>
            <Select.Option value="editing">剪辑</Select.Option>
            <Select.Option value="social">社交</Select.Option>
            <Select.Option value="movie">长视频</Select.Option>
            <template #outerBottomSlot>
                <div :style="outSlotStyle">
                    <span :style="{ color: 'var(--semi-color-link)' }">未找到应用?</span>
                </div>
            </template>
        </Select>
        <p :style="{ marginTop: '200px' }">innerBottomSlot:</p>
        <Select aria-label="innerBottomSlot" :maxHeight="150" placeholder="自定义内侧底部slot，滚动至底部显示" :style="{ width: '300px' }" :styles="{ dropdown: { width: '180px' } }">
            <Select.Option value="video">短视频</Select.Option>
            <Select.Option value="camera">相机</Select.Option>
            <Select.Option value="editing">剪辑</Select.Option>
            <Select.Option value="social">社交</Select.Option>
            <Select.Option value="movie">长视频</Select.Option>
            <template #innerBottomSlot>
                <div :style="innerSlotStyle">点击加载更多</div>
            </template>
        </Select>
    </div>
</template>
