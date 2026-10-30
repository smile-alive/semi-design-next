<script lang="ts">
    import type { Reference } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
    import { AIChatInput } from '../index';

    let { store }: { store: { references: Reference[]; retry: boolean } } = $props();
</script>

<div>
    {#if store.retry}
        <button class="retry" type="button">retry</button>
    {/if}
    <AIChatInput references={store.references} />
</div>
