<script lang="ts">
    import Carousel from '../carousel.svelte';
    import type { CarouselProps } from '../interface';

    export interface FixtureStore {
        count: number;
        activeIndex?: number;
        accept: boolean;
        log: string[];
        props: Partial<CarouselProps<number>>;
    }

    let { mode, store, ref }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: FixtureStore; ref: { current?: Carousel<number> } } = $props();

    const items = $derived(Array.from({ length: store.count }, (_, index) => index));

    // a function binding: the holder is a plain object, which `bind:this` on a member would flag as non-reactive
    const setRef = (instance?: Carousel<number>) => {
        ref.current = instance;
    };

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#snippet slide({ item }: { item: number })}
    <h3>index{item}</h3>
{/snippet}

{#if mode === 'bind'}
    <Carousel {...store.props} bind:activeIndex={store.activeIndex} bind:this={() => ref.current, setRef} {items} onChange={(index, preIndex) => log(`change ${index} ${preIndex}`)} {slide} />
{:else if mode === 'function'}
    <Carousel
        {...store.props}
        bind:activeIndex={
            () => store.activeIndex,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.activeIndex = value;
            }
        }
        bind:this={() => ref.current, setRef}
        {items}
        onChange={(index, preIndex) => log(`change ${index} ${preIndex}`)}
        {slide}
    />
{:else if mode === 'one-way'}
    <Carousel {...store.props} activeIndex={store.activeIndex} bind:this={() => ref.current, setRef} {items} onChange={(index, preIndex) => log(`change ${index} ${preIndex}`)} {slide} />
{:else}
    <Carousel {...store.props} bind:this={() => ref.current, setRef} {items} onChange={(index, preIndex) => log(`change ${index} ${preIndex}`)} {slide} />
{/if}
