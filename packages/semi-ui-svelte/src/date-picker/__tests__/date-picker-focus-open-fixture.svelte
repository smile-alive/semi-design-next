<script lang="ts" module>
    export interface FocusOpenFixtureStore {
        open: boolean;
        log: string[];
    }
</script>

<script lang="ts">
    import DatePicker from '../date-picker.svelte';

    let { store }: { store: FocusOpenFixtureStore } = $props();
</script>

<DatePicker
    motion={false}
    onFocus={() => {
        store.log.push('focus');
        store.open = true;
    }}
    onPresetClick={() => (store.open = false)}
    open={store.open}
    presets={[{ text: 'Preset', start: new Date('2022-03-03'), end: new Date('2022-03-03') }]}
    type="date"
/>
