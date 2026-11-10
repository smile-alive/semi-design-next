import { useState } from 'react';
import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    const [value, setValue] = useState<string | undefined>('movie');
    return (
        <>
            <Select aria-label="业务线" value={value} style={{ width: '300px' }} onChange={setValue} placeholder="受控的Select">
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="editing">剪辑</Select.Option>
                <Select.Option value="movie">长视频</Select.Option>
            </Select>
        </>
    );
}
