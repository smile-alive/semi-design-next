<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['抖音']);
</script>

<TagInput bind:value />
