<script lang="ts">
    import type { SliderSpecProps } from '@test/specs/slider';
    import { ConfigProvider } from '../../config-provider';
    import Slider from '../slider.svelte';

    let { store }: { store: SliderSpecProps } = $props();

    // Svelte has no `defaultValue`: the spec's default is the binding's initial value and its controlled value goes
    // through a function binding that rejects writes
    // svelte-ignore state_referenced_locally
    let chosen = $state<number | number[] | undefined>(store.defaultValue);
</script>

<ConfigProvider direction={store.direction}>
    <Slider
        aria-label={store.ariaLabel}
        bind:value={
            () => (store.value === undefined ? chosen : store.value),
            (value) => {
                if (store.value === undefined) {
                    chosen = value;
                }
            }
        }
        disabled={store.disabled}
        getAriaValueText={store.getAriaValueText}
        marks={store.marks}
        max={store.max}
        min={store.min}
        onAfterChange={store.onAfterChange}
        onChange={store.onChange}
        range={store.range}
        showMarkLabel={store.showMarkLabel}
        step={store.step}
        vertical={store.vertical}
        verticalReverse={store.verticalReverse}
    />
</ConfigProvider>
