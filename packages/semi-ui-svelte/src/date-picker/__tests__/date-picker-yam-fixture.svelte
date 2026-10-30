<script lang="ts" module>
    import type { YearAndMonthProps } from '../internal';

    export interface YamFixtureStore {
        props: Omit<YearAndMonthProps, 'onSelect' | 'onBackToMain' | 'dateInput' | 'quickControls'>;
        /** Entries of onSelect (JSON of the selection) and onBackToMain ('back') */
        log: string[];
        quickControls?: boolean;
        dateInput?: boolean;
    }
</script>

<script lang="ts">
    import YearAndMonth from '../year-and-month.svelte';

    let { store }: { store: YamFixtureStore } = $props();
</script>

{#snippet quick()}<div data-testid="quick">Quick</div>{/snippet}

{#snippet input()}<div data-testid="date-input">DateInput</div>{/snippet}

<YearAndMonth {...store.props} dateInput={store.dateInput ? input : undefined} onBackToMain={() => store.log.push('back')} onSelect={(selected) => store.log.push(JSON.stringify(selected))} quickControls={store.quickControls ? quick : undefined} />
