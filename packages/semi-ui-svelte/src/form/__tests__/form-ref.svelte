<script lang="ts">
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';

    let { onApi }: { onApi: (api: FormApi) => void } = $props();
    let instance = $state<{ getFormApi: () => FormApi }>();

    export const getInstance = () => instance;
</script>

<Form bind:this={instance} getFormApi={onApi} />
