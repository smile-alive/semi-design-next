<script lang="ts">
    import { Steps } from '../index';
    import type { StepData, StepsProps } from '../interface';

    let { snippets = [], store, ...props }: StepsProps & { snippets?: Array<'title' | 'description' | 'icon' | 'input-title'>; store?: StepsProps } = $props();

    const defaultItems: StepData[] = ['A', 'B', 'C'].map((title) => ({ title, description: title.toLowerCase() }));
    const baseItems = $derived(store?.dataSource ?? props.dataSource ?? defaultItems);
    const dataSource = $derived(snippets.includes('icon') ? baseItems.map((item, index) => (index === 0 ? { ...item, icon: ownIcon } : index === 1 ? { ...item, icon: false as const } : item)) : baseItems);
</script>

{#snippet title({ item, index }: { item: StepData; index: number })}<span class="own-title">{index}:{item.title}</span>{/snippet}
{#snippet description({ item }: { item: StepData; index: number })}<span class="own-description">{item.description}!</span>{/snippet}
{#snippet ownIcon()}<i class="own-icon"></i>{/snippet}
{#snippet inputTitle()}<input aria-label="name" />{/snippet}

<Steps {...props} {...store} {dataSource} description={snippets.includes('description') ? description : undefined} title={snippets.includes('title') ? title : snippets.includes('input-title') ? inputTitle : undefined} />
