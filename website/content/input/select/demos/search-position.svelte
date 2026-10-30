<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const businessList = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'xigua', label: '西瓜视频' },
    ];
    const semiList = Array.from({ length: 5 }, (_, i) => ({ value: `semi-${i}`, label: `Semi-${i}` }));
</script>

<Select aria-label="单选" filter optionList={businessList} placeholder="我的搜索框在下拉菜单中" searchPlaceholder="带搜索功能的单选" searchPosition="dropdown" style="width: 200px" value="ulikecam" />
<br />
<br />
<Select aria-label="多选" autoClearSearchValue={false} filter multiple optionList={semiList} placeholder="我的搜索框在下拉菜单中" searchPlaceholder="带搜索功能的多选" searchPosition="dropdown" style="width: 300px" value={['semi-1']} />
