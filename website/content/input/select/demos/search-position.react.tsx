import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="单选" filter searchPosition="dropdown" style={{ width: 200 }} defaultValue="ulikecam" placeholder="我的搜索框在下拉菜单中" searchPlaceholder="带搜索功能的单选">
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="多选" filter searchPosition="dropdown" multiple style={{ width: 300 }} defaultValue={['semi-1']} placeholder="我的搜索框在下拉菜单中" searchPlaceholder="带搜索功能的多选" autoClearSearchValue={false}>
                <Select.Option value="semi-0">Semi-0</Select.Option>
                <Select.Option value="semi-1">Semi-1</Select.Option>
                <Select.Option value="semi-2">Semi-2</Select.Option>
                <Select.Option value="semi-3">Semi-3</Select.Option>
                <Select.Option value="semi-4">Semi-4</Select.Option>
            </Select>
        </>
    );
}
