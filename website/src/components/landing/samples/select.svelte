<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'video', label: '短视频' },
        { value: 'editing', label: '剪辑' },
    ];

    let value = $state<string | undefined>('video');
</script>

<Select
    bind:value
    {optionList}
/>
