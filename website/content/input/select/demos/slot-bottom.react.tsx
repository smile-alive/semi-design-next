import { Select } from '@fibrae/semi-ui-react';

const innerSlotStyle = {
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
const outSlotStyle = {
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

export default function SelectDemo() {
    return (
        <div>
            <p>outerBottomSlot:</p>
            <Select
                aria-label="outerBottomSlot"
                style={{ width: 300 }}
                dropdownStyle={{ width: 180 }}
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
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="editing">剪辑</Select.Option>
                <Select.Option value="social">社交</Select.Option>
                <Select.Option value="movie">长视频</Select.Option>
            </Select>
            <p style={{ marginTop: 200 }}>innerBottomSlot:</p>
            <Select aria-label="innerBottomSlot" style={{ width: 300 }} dropdownStyle={{ width: 180 }} maxHeight={150} innerBottomSlot={<div style={innerSlotStyle}>点击加载更多</div>} placeholder="自定义内侧底部slot，滚动至底部显示">
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="editing">剪辑</Select.Option>
                <Select.Option value="social">社交</Select.Option>
                <Select.Option value="movie">长视频</Select.Option>
            </Select>
        </div>
    );
}
