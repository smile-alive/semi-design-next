<script lang="ts">
    import en_US from '@fibrae/semi-foundation/locale/source/en_US';
    import { ConfigProvider } from '../../config-provider';
    import type { RatingProps } from '../interface';
    import Rating from '../rating.svelte';

    interface Handle {
        focus: () => void;
        blur: () => void;
    }

    interface Store {
        props: RatingProps;
        direction?: 'ltr' | 'rtl';
        /** Falls back to the default zh_CN texts */
        zh?: boolean;
        /** Draws `text` in a node instead of passing it as the character string */
        node?: boolean;
        text?: string;
        after?: boolean;
    }

    let { store, onHandle }: { store: Store; onHandle?: (handle: Handle) => void } = $props();

    let handle: Handle | undefined = $state();

    $effect(() => {
        if (handle) {
            onHandle?.(handle);
        }
    });
</script>

{#snippet node()}<strong class="custom-char">{store.text}</strong>{/snippet}

<ConfigProvider direction={store.direction} locale={store.zh ? undefined : en_US}>
    <Rating {...store.props} bind:this={handle} character={store.node ? node : (store.text ?? store.props.character)} />
    {#if store.after}
        <button type="button">after</button>
    {/if}
</ConfigProvider>
