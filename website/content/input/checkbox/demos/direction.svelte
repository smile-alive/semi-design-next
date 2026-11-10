<script lang="ts">
    import { CheckboxGroup } from '@fibrae/semi-ui-svelte';

    const options = [
        { label: '短视频', value: 'video' },
        { label: '资讯', value: 'news' },
    ];
</script>

<CheckboxGroup aria-label="CheckboxGroup 示例" direction="horizontal" {options} />
