<script lang="ts" module>
    export interface WrappersFixtureStore {
        wrapper: 'form' | 'tooltip';
    }
</script>

<script lang="ts">
    import { Form, FormDatePicker } from '../../form';
    import { Tooltip } from '../../tooltip';
    import DatePicker from '../date-picker.svelte';

    let { store }: { store: WrappersFixtureStore } = $props();
</script>

{#snippet tip()}tip{/snippet}

{#if store.wrapper === 'form'}
    <Form labelPosition="inset">
        <FormDatePicker field="range" label="区间" type="dateRange" />
    </Form>
{:else}
    <Tooltip content={tip}>
        <DatePicker motion={false} />
    </Tooltip>
{/if}
