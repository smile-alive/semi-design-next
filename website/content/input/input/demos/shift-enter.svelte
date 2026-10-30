<script lang="ts">
    import { HotKeys, TextArea } from '@fibrae/semi-ui-svelte';

    let text = $state('');

    // Enter alone is swallowed; Shift+Enter keeps the native line break
    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
        }
    };
</script>

<div id="input-shift-enter-hint" style="display: flex">
    使用
    <HotKeys hotKeys={['shift', 'enter']} style="margin: 0 4px 12px" />
    换行的 TextArea
</div>
<TextArea aria-labelledby="input-shift-enter-hint" bind:value={text} {onKeyDown} />
