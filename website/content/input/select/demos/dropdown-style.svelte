<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'video', label: '短视频' },
        { value: 'camera', label: '相机' },
        { value: 'editing', label: '剪辑' },
        { value: 'movie', label: '长视频' },
    ];
</script>

<Select aria-label="业务线" dropdownClassName="test" dropdownStyle="width: 250px" {optionList} placeholder="自定义弹出层样式的" style="width: 180px" />
