<script lang="ts">
    import ScrollItem from '../scroll-item.svelte';
    import ScrollList from '../scroll-list.svelte';

    interface Props {
        cycled?: boolean;
        initial?: number;
        label?: string;
        mode?: 'normal' | 'wheel';
        motion?: boolean;
        onSelect?: (value: number) => void;
    }

    let { cycled = false, initial = 1, label = '1', mode = 'normal', motion = true, onSelect }: Props = $props();

    const list = Array.from({ length: 20 }, (_, index) => ({ value: index }));
    // the column starts from the prop, then follows its own selections
    let selectedIndex = $state<number | undefined>(undefined);
</script>

<ScrollList header="hello world">
    <ScrollItem aria-label={label} bind:selectedIndex={() => selectedIndex ?? initial, (value) => (selectedIndex = value)} {cycled} {list} {mode} {motion} onSelect={(data) => onSelect?.(data.value)} />
</ScrollList>
