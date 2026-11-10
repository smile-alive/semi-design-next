<script lang="ts" module>
    import type { DatePickerProps } from '../interface';

    export interface ContextFixtureStore {
        props: DatePickerProps;
        direction?: 'ltr' | 'rtl';
        label?: string;
        textTrigger?: boolean;
    }
</script>

<script lang="ts">
    import { ConfigProvider } from '../../config-provider';
    import DatePicker from '../date-picker.svelte';

    let { store }: { store: ContextFixtureStore } = $props();
</script>

{#snippet textTrigger()}<span>pick</span>{/snippet}

<ConfigProvider direction={store.direction}>
    {#if store.label}
        <span id="external-label">{store.label}</span>
    {/if}
    <DatePicker {...store.props} trigger={store.textTrigger ? textTrigger : undefined} />
</ConfigProvider>
