<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'xigua', label: '西瓜视频' },
    ];
</script>

<Select aria-label="业务线" dropdownClassName="test" dropdownStyle="width: 250px" {optionList} placeholder="自定义弹出层样式的" style="width: 180px" />
