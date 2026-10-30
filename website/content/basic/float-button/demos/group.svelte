<script lang="ts">
    import { IconAIStrokedLevel3, IconHelpCircleStroked, IconSearchStroked } from '@fibrae/semi-icons-svelte';
    import { FloatButtonGroup } from '@fibrae/semi-ui-svelte';

    const icons = [IconAIStrokedLevel3, IconSearchStroked, IconHelpCircleStroked];

    const items = [
        { content: '编辑', value: 'editor' },
        { content: '搜索', value: 'search', disabled: true },
        { content: '帮助', value: 'help', href: 'https://semi.design', target: '_blank' },
    ];

    const onClick = (value?: string) => {
        console.log('点击了 ', value);
    };
</script>

<span>页面右下方最后一行</span>
<FloatButtonGroup {items} {onClick} style="inset-inline-end: 24px; bottom: 50px">
    {#snippet icon({ index })}
        {@const Icon = icons[index]}
        <Icon />
    {/snippet}
</FloatButtonGroup>
