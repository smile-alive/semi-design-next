<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const businessList = [
        { value: 'video', label: '短视频' },
        { value: 'camera', label: '相机' },
        { value: 'editing', label: '剪辑' },
        { value: 'movie', label: '长视频' },
    ];
    const semiList = Array.from({ length: 5 }, (_, i) => ({ value: `semi-${i}`, label: `Semi-${i}` }));
</script>

<Select aria-label="单选" filter optionList={businessList} placeholder="带搜索功能的单选" style="width: 180px" />
<br />
<br />
<Select aria-label="多选" autoClearSearchValue={false} filter multiple optionList={semiList} placeholder="带搜索功能的多选" style="width: 300px" />
