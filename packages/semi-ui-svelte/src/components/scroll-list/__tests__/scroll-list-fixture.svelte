<script lang="ts">
    import type { ScrollItemSelectData } from '../interface';
    import ScrollItem from '../scroll-item.svelte';
    import ScrollList from '../scroll-list.svelte';

    interface Props {
        variant: 'snippets' | 'strings' | 'empty' | 'demo' | 'named';
        mode?: 'normal' | 'wheel';
        store?: { ampm: number; onSelect: (kind: string, data: ScrollItemSelectData) => void };
    }

    let { variant, mode = 'wheel', store }: Props = $props();

    const ampms = [
        { value: 'AM', transform: () => '上午' },
        { value: 'PM', transform: () => '下午' },
    ];
    const hours = Array.from({ length: 12 }, (_, index) => ({ value: index + 1 }));
    const minutes = Array.from({ length: 60 }, (_, index) => ({ value: index, disabled: index % 2 === 1 }));
</script>

{#if variant === 'snippets'}
    <ScrollList bodyHeight={200}>
        {#snippet header()}title{/snippet}
        {#snippet footer()}foot{/snippet}
        <span>child</span>
    </ScrollList>
{:else if variant === 'strings'}
    <ScrollList footer="prop foot" header="prop title">child</ScrollList>
{:else if variant === 'named'}
    <ScrollList aria-label="time" data-testid="list">child</ScrollList>
{:else if variant === 'empty'}
    <ScrollList>child</ScrollList>
{:else if store}
    <ScrollList>
        {#snippet header()}滚动列表{/snippet}
        <ScrollItem cycled={false} list={ampms} {mode} onSelect={(data) => store.onSelect('ampm', data)} selectedIndex={store.ampm} type={1} />
        <ScrollItem cycled={false} list={hours} {mode} onSelect={(data) => store.onSelect('hour', data)} selectedIndex={1} type={2} />
        <ScrollItem cycled={false} list={minutes} {mode} onSelect={(data) => store.onSelect('minute', data)} selectedIndex={1} type={3} />
        {#snippet footer()}<button type="button">Ok</button>{/snippet}
    </ScrollList>
{/if}
