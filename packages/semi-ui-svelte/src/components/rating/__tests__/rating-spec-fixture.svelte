<script lang="ts">
    import type { RatingSpecProps } from '@test/specs/rating';
    import { ConfigProvider } from '../../config-provider';
    import Rating from '../rating.svelte';

    let { store }: { store: RatingSpecProps } = $props();

    // Svelte has no `defaultValue`: the spec's default is the binding's initial value and its controlled value goes
    // through a function binding that rejects writes
    // svelte-ignore state_referenced_locally
    let chosen = $state<number | undefined>(store.defaultValue);
</script>

<ConfigProvider direction={store.direction}>
    <Rating
        allowClear={store.allowClear}
        allowHalf={store.allowHalf}
        aria-label={store.ariaLabel}
        bind:value={
            () => (store.value === undefined ? chosen : store.value),
            (value) => {
                if (store.value === undefined) {
                    chosen = value;
                }
            }
        }
        character={store.character}
        count={store.count}
        disabled={store.disabled}
        onBlur={store.onBlur}
        onChange={store.onChange}
        onClick={store.onClick}
        onFocus={store.onFocus}
        onHoverChange={store.onHoverChange}
        onKeyDown={store.onKeyDown}
        size={store.size}
        tooltips={store.tooltips}
    />
</ConfigProvider>
