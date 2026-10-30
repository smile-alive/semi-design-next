<script lang="ts">
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';

    let { holder, onApi }: { holder: { instance?: { getFormApi: () => FormApi } }; onApi: (api: FormApi) => void } = $props();
</script>

<Form bind:this={holder.instance} getFormApi={onApi} />
