<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'video', label: '短视频' },
        { value: 'camera', label: '相机' },
        { value: 'editing', label: '剪辑' },
        { value: 'movie', label: '长视频' },
    ];

    let value = $state<string | undefined>('movie');
</script>

<Select aria-label="业务线" bind:value {optionList} placeholder="受控的Select" style="width: 300px" />
