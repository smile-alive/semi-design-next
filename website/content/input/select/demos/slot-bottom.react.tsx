import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    let innerSlotStyle = {
        backgroundColor: 'var(--color-white)',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        paddingLeft: 32,
        borderTop: '1px solid var(--semi-color-border)',
        borderRadius: '0 0 6px 6px',
        color: 'var(--semi-color-link)',
    };
    let innerSlotNode = <div style={innerSlotStyle}>点击加载更多</div>;
    let outSlotStyle = {
        backgroundColor: 'var(--semi-color-fill-0)',
        height: '36px',
        display: 'flex',
        paddingLeft: 32,
        color: 'var(--semi-color-link)',
        alignItems: 'center',
        cursor: 'pointer',
        borderTop: '1px solid var(--semi-color-border)',
        borderRadius: '0 0 6px 6px',
    };
    let outSlotNode = (
        <div style={outSlotStyle}>
            <span style={{ color: 'var(--semi-color-link)' }}>未找到应用?</span>
        </div>
    );

    return (
        <div>
            <p>outerBottomSlot:</p>
            <Select aria-label="outerBottomSlot" style={{ width: 300 }} dropdownStyle={{ width: 180 }} maxHeight={150} outerBottomSlot={outSlotNode} placeholder="自定义外侧底部slot，始终显示" defaultOpen autoAdjustOverflow={false} position="bottom">
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="duoshan">多闪</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
            <p style={{ marginTop: 200 }}>innerBottomSlot:</p>
            <Select aria-label="innerBottomSlot" style={{ width: 300 }} dropdownStyle={{ width: 180 }} maxHeight={150} innerBottomSlot={innerSlotNode} placeholder="自定义内侧底部slot，滚动至底部显示">
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="duoshan">多闪</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
        </div>
    );
}
