<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'duoshan', label: '多闪' },
        { value: 'xigua', label: '西瓜视频' },
    ];
    const innerSlotStyle = 'background-color: var(--color-white); height: 36px; display: flex; align-items: center; cursor: pointer; padding-left: 32px; border-top: 1px solid var(--semi-color-border); border-radius: 0 0 6px 6px; color: var(--semi-color-link)';
    const outSlotStyle = 'background-color: var(--semi-color-fill-0); height: 36px; display: flex; padding-left: 32px; color: var(--semi-color-link); align-items: center; cursor: pointer; border-top: 1px solid var(--semi-color-border); border-radius: 0 0 6px 6px';
</script>

<div>
    <p>outerBottomSlot:</p>
    <Select aria-label="outerBottomSlot" autoAdjustOverflow={false} defaultOpen dropdownStyle="width: 180px" maxHeight={150} {optionList} placeholder="自定义外侧底部slot，始终显示" position="bottom" style="width: 300px">
        {#snippet outerBottomSlot()}
            <div style={outSlotStyle}>
                <span style="color: var(--semi-color-link)">未找到应用?</span>
            </div>
        {/snippet}
    </Select>
    <p style="margin-top: 200px">innerBottomSlot:</p>
    <Select aria-label="innerBottomSlot" dropdownStyle="width: 180px" maxHeight={150} {optionList} placeholder="自定义内侧底部slot，滚动至底部显示" style="width: 300px">
        {#snippet innerBottomSlot()}
            <div style={innerSlotStyle}>点击加载更多</div>
        {/snippet}
    </Select>
</div>
