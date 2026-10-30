<script lang="ts">
    import type { ComponentProps } from 'svelte';
    import FormInput from '../form-input.svelte';
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';
    import HooksProbe from './b-hooks-probe.svelte';

    let { store, outside = false, onApi, onProbe }: { store: { field: string; initValues?: Record<string, unknown> }; outside?: boolean; onApi?: (api: FormApi) => void; onProbe?: ComponentProps<typeof HooksProbe>['onProbe'] } = $props();
</script>

{#if outside}
    <HooksProbe {onProbe} {store} />
{:else}
    <Form getFormApi={onApi} initValues={store.initValues}>
        <FormInput field="a" />
        <FormInput field="b" />
        <HooksProbe {onProbe} {store} />
    </Form>
{/if}
