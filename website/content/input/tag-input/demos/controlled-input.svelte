<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    let inputValue = $state('abc');
</script>

<TagInput bind:inputValue />
