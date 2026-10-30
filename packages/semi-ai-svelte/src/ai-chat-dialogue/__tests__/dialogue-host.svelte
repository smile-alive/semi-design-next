<script lang="ts" module>
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import type { AIChatDialogueProps, Message, RoleConfig } from '../interface';

    type Part = 'avatar' | 'title' | 'content' | 'action' | 'fullDialogue' | 'contentItem' | 'messageText' | 'messageEdit' | 'hintBox';

    export interface DialogueHostStore {
        chats?: Message[];
        hints?: string[];
        roleConfig: RoleConfig;
        locale?: Locale;
        /** The custom snippets passed to the dialogue */
        shown: Partial<Record<Part, boolean>>;
        /** Whether the custom snippets also render the default nodes they receive */
        withDefaults?: boolean;
        props?: Partial<AIChatDialogueProps>;
    }
</script>

<script lang="ts">
    import LocaleProvider from '@fibrae/semi-ui-svelte/locale/locale-provider.svelte';
    import { AIChatDialogue } from '../../index';

    let { store }: { store: DialogueHostStore } = $props();
</script>

{#snippet avatar({ defaultAvatar, message, role }: Parameters<NonNullable<AIChatDialogueProps['avatar']>>[0])}
    <div class="custom-avatar" data-role={role?.name}>
        <span class="id">{message.id}</span>
        {#if store.withDefaults}
            {@render defaultAvatar()}
        {/if}
    </div>
{/snippet}

{#snippet title({ defaultTitle, message, role }: Parameters<NonNullable<AIChatDialogueProps['title']>>[0])}
    <div class="custom-title" data-role={role?.name}>
        <span class="id">{message.id}</span>
        {#if store.withDefaults}
            {@render defaultTitle()}
        {/if}
    </div>
{/snippet}

{#snippet content({ defaultContent, message, role, class: cls }: Parameters<NonNullable<AIChatDialogueProps['content']>>[0])}
    <div class={['custom-content', cls]} data-role={role?.name}>
        <span class="id">{message.id}</span>
        {#if store.withDefaults}
            {@render defaultContent()}
        {/if}
    </div>
{/snippet}

{#snippet action({ defaultActions, defaultActionsObj, message, class: cls }: Parameters<NonNullable<AIChatDialogueProps['action']>>[0])}
    <div class={['custom-action', cls]}>
        <span class="id">{message.id}</span>
        {#if store.withDefaults}
            {#each defaultActions as node, index (index)}
                {@render node()}
            {/each}
        {/if}
        <span class="keys">{Object.keys(defaultActionsObj).toSorted().join(',')}</span>
    </div>
{/snippet}

{#snippet fullDialogue({ defaultNodes, message, role, class: cls }: Parameters<NonNullable<AIChatDialogueProps['fullDialogue']>>[0])}
    <div class={['custom-full', cls]} data-role={role?.name}>
        <span class="id">{message.id}</span>
        {#if store.withDefaults}
            {@render defaultNodes.avatar()}
            <div class="full-main">
                {@render defaultNodes.title()}
                {@render defaultNodes.content()}
                {@render defaultNodes.action()}
            </div>
        {/if}
    </div>
{/snippet}

{#snippet contentItem({ item, type, message, defaultItem, class: cls }: Parameters<NonNullable<AIChatDialogueProps['contentItem']>>[0])}
    {#if type === 'function_call' && 'name' in item && item.name === 'search'}
        <span class={['custom-search', cls]}>{item.name}</span>
    {:else if type === 'reasoning'}
        <span class={['custom-reasoning', cls]}>{message.id}</span>
    {:else if type === 'output_text' && 'text' in item}
        <b class={cls}>{item.text}</b>
    {:else}
        {@render defaultItem()}
    {/if}
{/snippet}

{#snippet messageText({ text }: Parameters<NonNullable<AIChatDialogueProps['messageText']>>[0])}
    <em class="custom-text">{text}</em>
{/snippet}

{#snippet messageEdit({ inputContents }: Parameters<NonNullable<AIChatDialogueProps['messageEdit']>>[0])}
    <div class="editor" data-count={inputContents?.length}>editor</div>
{/snippet}

{#snippet hintBox({ content: hint, onHintClick }: Parameters<NonNullable<AIChatDialogueProps['hintBox']>>[0])}
    <button type="button" onclick={onHintClick}>{`box-${hint}`}</button>
{/snippet}

<span data-testid="count">{store.chats?.length ?? 0}</span>
<LocaleProvider locale={store.locale}>
    <AIChatDialogue
        {...store.props}
        action={store.shown.action ? action : undefined}
        avatar={store.shown.avatar ? avatar : undefined}
        bind:chats={store.chats}
        content={store.shown.content ? content : undefined}
        contentItem={store.shown.contentItem ? contentItem : undefined}
        fullDialogue={store.shown.fullDialogue ? fullDialogue : undefined}
        hintBox={store.shown.hintBox ? hintBox : undefined}
        hints={store.hints}
        messageEdit={store.shown.messageEdit ? messageEdit : undefined}
        messageText={store.shown.messageText ? messageText : undefined}
        roleConfig={store.roleConfig}
        title={store.shown.title ? title : undefined}
    />
</LocaleProvider>
