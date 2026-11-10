<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['短视频']);
</script>

<TagInput bind:value />
