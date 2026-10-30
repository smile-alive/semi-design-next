<script lang="ts" module>
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import type { ChatMessage, ChatProps, ChatRoleConfig } from '../interface';

    type Part = 'title' | 'avatar' | 'roleAvatar' | 'content' | 'action' | 'fullChatBox' | 'inputArea' | 'hintBox' | 'divider' | 'uploadButton' | 'uploadTip' | 'topSlot' | 'bottomSlot';

    export interface ChatHostStore {
        chats?: ChatMessage[];
        hints?: string[];
        roleConfig?: ChatRoleConfig;
        locale?: Locale;
        /** The custom snippets passed to the chat */
        shown: Partial<Record<Part, boolean>>;
        /** Whether the custom snippets also render the default nodes they receive */
        withDefaults?: boolean;
        props?: Partial<ChatProps>;
    }
</script>

<script lang="ts">
    import LocaleProvider from '@fibrae/semi-ui-svelte/locale/locale-provider.svelte';
    import { Chat } from '../index';

    let { store }: { store: ChatHostStore } = $props();

    let chat = $state<ReturnType<typeof Chat>>();

    export function getHandle() {
        return chat;
    }
</script>

{#snippet title({ defaultTitle, role }: Parameters<NonNullable<ChatProps['title']>>[0])}
    <div class="custom-title">
        {role.name}!
        {#if store.withDefaults}
            {@render defaultTitle()}
        {/if}
    </div>
{/snippet}

{#snippet avatar({ defaultAvatar, role }: Parameters<NonNullable<ChatProps['avatar']>>[0])}
    <div class="custom-avatar">
        {role.name}
        {#if store.withDefaults}
            {@render defaultAvatar()}
        {/if}
    </div>
{/snippet}

{#snippet roleAvatar({ role }: Parameters<NonNullable<ChatProps['roleAvatar']>>[0])}
    <b class="initial">{role.name?.[0]}</b>
{/snippet}

{#snippet content({ defaultContent, message, class: cls }: Parameters<NonNullable<ChatProps['content']>>[0])}
    <div class={['custom-content', cls]}>
        {#if store.withDefaults}
            {@render defaultContent()}
        {:else}
            {message.content}
        {/if}
    </div>
{/snippet}

{#snippet action({ defaultActions, defaultActionsObj, class: cls }: Parameters<NonNullable<ChatProps['action']>>[0])}
    <div class={['custom-action', cls]}>
        {#if store.withDefaults}
            {#each defaultActions as node, index (index)}
                {@render node()}
            {/each}
        {:else}
            {Object.keys(defaultActionsObj).join(',')}
        {/if}
    </div>
{/snippet}

{#snippet fullChatBox({ defaultNodes, class: cls }: Parameters<NonNullable<ChatProps['fullChatBox']>>[0])}
    <div class={['custom-full', cls]}>
        {#if store.withDefaults}
            {@render defaultNodes.avatar()}
            <div class="semi-chat-chatBox-wrap">
                {@render defaultNodes.title()}
                {@render defaultNodes.content()}
                {@render defaultNodes.action()}
            </div>
        {:else}
            {@render defaultNodes.title()}
            {@render defaultNodes.content()}
        {/if}
    </div>
{/snippet}

{#snippet inputArea({ defaultNode, inputNode, sendNode, uploadNode, clearContextNode, onSend, onClear, onClick }: Parameters<NonNullable<ChatProps['inputArea']>>[0])}
    {#if store.withDefaults}
        <div data-testid="default">{@render defaultNode()}</div>
    {:else}
        <div data-testid="input">{@render inputNode()}</div>
        <div data-testid="send">{@render sendNode()}</div>
        <div data-testid="upload">{@render uploadNode?.()}</div>
        <div data-testid="clear">{@render clearContextNode()}</div>
    {/if}
    <button type="button" onclick={() => onSend('custom', [])}>send it</button>
    <button type="button" onclick={() => onClear()}>clear it</button>
    <button type="button" onclick={onClick}>focus it</button>
{/snippet}

{#snippet hintBox({ content: hint, index, onHintClick }: Parameters<NonNullable<ChatProps['hintBox']>>[0])}
    <button type="button" onclick={onHintClick}>{`${index}:${hint}`}</button>
{/snippet}

{#snippet divider({ message }: Parameters<NonNullable<ChatProps['divider']>>[0])}
    <hr data-id={message.id} />
{/snippet}

{#snippet uploadButton()}
    <span data-testid="trigger">pick</span>
{/snippet}

{#snippet uploadTip()}
    tip text
{/snippet}

{#snippet topSlot()}
    <div data-testid="top"></div>
{/snippet}

{#snippet bottomSlot()}
    <div data-testid="bottom"></div>
{/snippet}

<span data-testid="count">{store.chats?.length ?? 0}</span>
<LocaleProvider locale={store.locale}>
    <Chat
        bind:chats={store.chats}
        bind:this={chat}
        {...store.props}
        action={store.shown.action ? action : undefined}
        avatar={store.shown.avatar ? avatar : undefined}
        bottomSlot={store.shown.bottomSlot ? bottomSlot : undefined}
        content={store.shown.content ? content : undefined}
        divider={store.shown.divider ? divider : undefined}
        fullChatBox={store.shown.fullChatBox ? fullChatBox : undefined}
        hintBox={store.shown.hintBox ? hintBox : undefined}
        hints={store.hints}
        inputArea={store.shown.inputArea ? inputArea : undefined}
        roleAvatar={store.shown.roleAvatar ? roleAvatar : undefined}
        roleConfig={store.roleConfig}
        title={store.shown.title ? title : undefined}
        topSlot={store.shown.topSlot ? topSlot : undefined}
        uploadButton={store.shown.uploadButton ? uploadButton : undefined}
        uploadTip={store.shown.uploadTip ? uploadTip : undefined}
    />
</LocaleProvider>
