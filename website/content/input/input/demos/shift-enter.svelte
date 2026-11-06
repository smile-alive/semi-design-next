<script lang="ts">
    import { HotKeys, TextArea } from '@fibrae/semi-ui-svelte';

    let text = $state('');

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
        }
    };
</script>

<div id="input-shift-enter-hint" style="display: flex">
    使用
    <HotKeys hotKeys={['shift', 'enter']} style="margin-block-end: 12px; margin-inline: 4px" />
    换行的 TextArea
</div>
<TextArea aria-labelledby="input-shift-enter-hint" bind:value={text} onKeyDown={handleKeyDown} />
