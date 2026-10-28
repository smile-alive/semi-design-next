import { useState } from 'react';
import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    let [value, setValue] = useState<string | undefined>('xigua');
    return (
        <>
            <Select aria-label="业务线" value={value} style={{ width: '300px' }} onChange={setValue} placeholder="受控的Select">
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
        </>
    );
}
