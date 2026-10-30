<script lang="ts">
    import type { Attachment } from 'svelte/attachments';
    import Avatar from '../../avatar/avatar.svelte';
    import Input from '../../input/input.svelte';
    import ListItem from '../../list/item.svelte';
    import Switch from '../../switch/switch.svelte';

    let { onAttach }: { onAttach: (name: string, node: Element) => void } = $props();

    const attachTo =
        (name: string): Attachment =>
        (node) =>
            onAttach(name, node);
</script>

<Input {@attach attachTo('input')} aria-label="名称" />
<Switch {@attach attachTo('switch')} aria-label="开关" />
<ul>
    <ListItem {@attach attachTo('static-item')} data-testid="static-item" />
    <ListItem {@attach attachTo('clickable-item')} onClick={() => {}}>可点击项</ListItem>
</ul>
<Avatar {@attach attachTo('static-avatar')} data-testid="static-avatar">A</Avatar>
<Avatar {@attach attachTo('clickable-avatar')} aria-label="可点击头像" onclick={() => {}}>B</Avatar>
