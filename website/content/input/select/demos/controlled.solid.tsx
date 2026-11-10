import { createSignal } from 'solid-js';
import { Select } from '@fibrae/semi-ui-solid';

export default function SelectDemo() {
    const [value, setValue] = createSignal<string | undefined>('movie');
    return (
        <Select aria-label="业务线" value={value()} style={{ width: '300px' }} onChange={(v) => setValue(v)} placeholder="受控的Select">
            <Select.Option value="video">短视频</Select.Option>
            <Select.Option value="camera">相机</Select.Option>
            <Select.Option value="editing">剪辑</Select.Option>
            <Select.Option value="movie">长视频</Select.Option>
        </Select>
    );
}
