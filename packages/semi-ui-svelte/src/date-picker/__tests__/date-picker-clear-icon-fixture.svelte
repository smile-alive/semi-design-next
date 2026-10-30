<script lang="ts" module>
    import type { DatePickerProps } from '../interface';

    export interface ClearIconFixtureStore {
        props: Omit<DatePickerProps, 'clearIcon'>;
    }
</script>

<script lang="ts">
    import DatePicker from '../date-picker.svelte';

    let { store }: { store: ClearIconFixtureStore } = $props();
</script>

{#snippet clearIcon()}<span class="custom-clear-icon">X</span>{/snippet}

<DatePicker {...store.props} {clearIcon} />
