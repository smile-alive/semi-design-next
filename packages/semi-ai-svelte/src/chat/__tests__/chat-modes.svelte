<script lang="ts">
    import { Chat } from '../index';
    import type { ChatMessage, ChatRoleConfig } from '../interface';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { chats?: ChatMessage[]; roleConfig: ChatRoleConfig; accept: boolean; log: string[] } } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <Chat bind:chats={store.chats} onChatsChange={(next) => log(`change ${next.length}`)} roleConfig={store.roleConfig} />
{:else if mode === 'function'}
    <Chat
        bind:chats={
            () => store.chats,
            (next) => {
                log(`set ${next?.length}`);
                if (store.accept) store.chats = next;
            }
        }
        onChatsChange={(next) => log(`change ${next.length}`)}
        roleConfig={store.roleConfig}
    />
{:else if mode === 'one-way'}
    <Chat chats={store.chats} onChatsChange={(next) => log(`change ${next.length}`)} roleConfig={store.roleConfig} />
{:else}
    <Chat onChatsChange={(next) => log(`change ${next.length}`)} roleConfig={store.roleConfig} />
{/if}
