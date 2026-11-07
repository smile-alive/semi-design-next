<script lang="ts">
    let { value = $bindable(false) }: { value?: boolean } = $props();
</script>

<span>{value}</span>
