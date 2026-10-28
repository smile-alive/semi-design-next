import { createSignal } from 'solid-js';
import { Select } from '@fibrae/semi-ui-solid';

export default function SelectDemo() {
    const [value, setValue] = createSignal<string | undefined>('xigua');
    return (
        <Select aria-label="业务线" value={value()} style={{ width: '300px' }} onChange={(v) => setValue(v)} placeholder="受控的Select">
            <Select.Option value="douyin">抖音</Select.Option>
            <Select.Option value="ulikecam">轻颜相机</Select.Option>
            <Select.Option value="jianying">剪映</Select.Option>
            <Select.Option value="xigua">西瓜视频</Select.Option>
        </Select>
    );
}
