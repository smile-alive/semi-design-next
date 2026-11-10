import { Select } from '@fibrae/semi-ui-solid';

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="单选" filter style={{ width: '180px' }} placeholder="带搜索功能的单选">
                <Select.Option value="video" label="短视频" />
                <Select.Option value="camera" label="相机" />
                <Select.Option value="editing" label="剪辑" />
                <Select.Option value="movie" label="长视频" />
            </Select>
            <br />
            <br />
            <Select aria-label="多选" filter multiple style={{ width: '300px' }} placeholder="带搜索功能的多选" autoClearSearchValue={false}>
                <Select.Option value="semi-0" label="Semi-0" />
                <Select.Option value="semi-1" label="Semi-1" />
                <Select.Option value="semi-2" label="Semi-2" />
                <Select.Option value="semi-3" label="Semi-3" />
                <Select.Option value="semi-4" label="Semi-4" />
            </Select>
        </>
    );
}
