import { Select } from '@fibrae/semi-ui-solid';

const innerSlotStyle = {
    'background-color': 'var(--color-white)',
    height: '36px',
    display: 'flex',
    'align-items': 'center',
    cursor: 'pointer',
    'padding-left': '32px',
    'border-top': '1px solid var(--semi-color-border)',
    'border-radius': '0 0 6px 6px',
    color: 'var(--semi-color-link)',
};
const outSlotStyle = {
    'background-color': 'var(--semi-color-fill-0)',
    height: '36px',
    display: 'flex',
    'padding-left': '32px',
    color: 'var(--semi-color-link)',
    'align-items': 'center',
    cursor: 'pointer',
    'border-top': '1px solid var(--semi-color-border)',
    'border-radius': '0 0 6px 6px',
};

export default function SelectDemo() {
    return (
        <div>
            <p>outerBottomSlot:</p>
            <Select
                aria-label="outerBottomSlot"
                style={{ width: '300px' }}
                dropdownStyle={{ width: '180px' }}
                maxHeight={150}
                outerBottomSlot={
                    <div style={outSlotStyle}>
                        <span style={{ color: 'var(--semi-color-link)' }}>未找到应用?</span>
                    </div>
                }
                placeholder="自定义外侧底部slot，始终显示"
                defaultOpen
                autoAdjustOverflow={false}
                position="bottom"
            >
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="duoshan">多闪</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
            <p style={{ 'margin-top': '200px' }}>innerBottomSlot:</p>
            <Select aria-label="innerBottomSlot" style={{ width: '300px' }} dropdownStyle={{ width: '180px' }} maxHeight={150} innerBottomSlot={<div style={innerSlotStyle}>点击加载更多</div>} placeholder="自定义内侧底部slot，滚动至底部显示">
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="duoshan">多闪</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
        </div>
    );
}
