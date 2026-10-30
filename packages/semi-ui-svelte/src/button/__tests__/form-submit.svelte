<script lang="ts">
    import Button from '../button.svelte';

    let { store }: { store: { loading: boolean; submitted: number } } = $props();
</script>

<form
    onsubmit={(event) => {
        event.preventDefault();
        store.submitted += 1;
    }}
>
    <Button htmlType="submit" loading={store.loading}>save</Button>
</form>
