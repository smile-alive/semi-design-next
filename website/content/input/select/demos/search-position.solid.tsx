import { Select } from '@fibrae/semi-ui-solid';

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="单选" filter searchPosition="dropdown" style={{ width: '200px' }} defaultValue="ulikecam" placeholder="我的搜索框在下拉菜单中" searchPlaceholder="带搜索功能的单选">
                <Select.Option value="douyin" label="抖音" />
                <Select.Option value="ulikecam" label="轻颜相机" />
                <Select.Option value="jianying" label="剪映" />
                <Select.Option value="xigua" label="西瓜视频" />
            </Select>
            <br />
            <br />
            <Select aria-label="多选" filter searchPosition="dropdown" multiple style={{ width: '300px' }} defaultValue={['semi-1']} placeholder="我的搜索框在下拉菜单中" searchPlaceholder="带搜索功能的多选" autoClearSearchValue={false}>
                <Select.Option value="semi-0" label="Semi-0" />
                <Select.Option value="semi-1" label="Semi-1" />
                <Select.Option value="semi-2" label="Semi-2" />
                <Select.Option value="semi-3" label="Semi-3" />
                <Select.Option value="semi-4" label="Semi-4" />
            </Select>
        </>
    );
}
