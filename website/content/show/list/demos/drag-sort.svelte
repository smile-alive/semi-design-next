<script lang="ts">
    import { untrack, type ComponentProps } from 'svelte';
    import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
    import { Accessibility, DragDropManager } from '@dnd-kit/dom';
    import { isSortable, OptimisticSortingPlugin, Sortable } from '@dnd-kit/dom/sortable';
    import { DragDropProvider } from '@dnd-kit/svelte';
    import { Avatar, List, ListItem, type AvatarColor } from '@fibrae/semi-ui-svelte';

    interface Entry {
        id: number;
        title: string;
        color: AvatarColor;
    }

    type ProviderProps = ComponentProps<typeof DragDropProvider>;

    const data: Entry[] = [
        { id: 1, title: 'Semi Design Title 1', color: 'red' },
        { id: 2, title: 'Semi Design Title 2', color: 'grey' },
        { id: 3, title: 'Semi Design Title 3', color: 'light-green' },
        { id: 4, title: 'Semi Design Title 4', color: 'light-blue' },
        { id: 5, title: 'Semi Design Title 5', color: 'pink' },
    ];

    let listItems = $state.raw(data);
    // The order shown while dragging; cleared on drop, so `listItems` stays the only truth
    let preview = $state.raw<Entry[] | null>(null);
    let draggingId = $state<number | string>();
    const ordered = $derived(preview ?? listItems);

    // The provider overwrites the plugins and modifiers of the manager it is given with its own props, so they go there
    const manager = new DragDropManager();
    // Accessibility would add role="button" and a Tab stop to each li; pointer dragging only
    const plugins: ProviderProps['plugins'] = (defaults) => defaults.filter((plugin) => plugin !== Accessibility);
    const modifiers = [RestrictToVerticalAxis];
    // OptimisticSortingPlugin moves DOM nodes itself, which collides with Svelte's keyed each; `preview` drives the order instead
    const sortablePlugins: ConstructorParameters<typeof Sortable>[0]['plugins'] = (defaults) => defaults.filter((plugin) => plugin !== OptimisticSortingPlugin);

    // A non-clickable ListItem hands the attachment its li, which is the element dragged
    const sortable = (id: number, position: () => number) => (element: HTMLElement) => {
        const item = new Sortable({ id, index: untrack(position), element, plugins: sortablePlugins }, manager);
        $effect(() => {
            item.index = position();
        });
        return () => item.destroy();
    };

    const onDragStart: ProviderProps['onDragStart'] = ({ operation: { source } }) => {
        draggingId = source?.id;
    };
    const onDragOver: ProviderProps['onDragOver'] = ({ operation: { source, target } }) => {
        if (!isSortable(source) || !isSortable(target) || source.id === target.id) return;
        const next = [...ordered];
        const from = next.findIndex((entry) => entry.id === source.id);
        const to = next.findIndex((entry) => entry.id === target.id);
        if (from < 0 || to < 0) return;
        next.splice(to, 0, ...next.splice(from, 1));
        preview = next;
    };
    const onDragEnd: ProviderProps['onDragEnd'] = ({ canceled }) => {
        if (!canceled) listItems = ordered;
        preview = null;
        draggingId = undefined;
    };
</script>

<div style="padding: 12px; border: 1px solid var(--semi-color-border); margin: 12px">
    <DragDropProvider {manager} {modifiers} {onDragEnd} {onDragOver} {onDragStart} {plugins}>
        <List>
            <!-- Keyed by id: dnd-kit reorders li nodes mid-drag, and the keyed each moves them with their data -->
            {#each ordered as entry, position (entry.id)}
                {@const dragging = draggingId === entry.id}
                <ListItem {@attach sortable(entry.id, () => position)} class={dragging ? 'isDragging' : undefined} style="border: 1px solid var(--semi-color-border); margin-bottom: 12px; cursor: grabbing{dragging ? '; z-index: 999; position: relative; background-color: var(--semi-color-bg-0)' : ''}">
                    {#snippet header()}
                        <Avatar color={entry.color}>SE</Avatar>
                    {/snippet}
                    {#snippet main()}
                        <div>
                            <span style="color: var(--semi-color-text-0); font-weight: 500">{entry.title}</span>
                            <p style="color: var(--semi-color-text-2); margin: 4px 0">Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                        </div>
                    {/snippet}
                </ListItem>
            {/each}
        </List>
    </DragDropProvider>
</div>
