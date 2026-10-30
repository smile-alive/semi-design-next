<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import Checkbox from '@fibrae/semi-ui-svelte/checkbox/checkbox.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import { getAIChatDialogueContext } from './context.js';
    import DialogueAction from './dialogue-action.svelte';
    import DialogueAvatar from './dialogue-avatar.svelte';
    import DialogueContent from './dialogue-content.svelte';
    import DialogueTitle from './dialogue-title.svelte';
    import type { Metadata } from './interface.js';

    interface DialogueProps {
        message: Message;
        role?: Metadata | Map<string, Metadata>;
        isLastChat: boolean;
        isSelected: boolean;
    }

    let { message, role, isLastChat, isSelected }: DialogueProps = $props();

    const { view, snippets, selectChange } = getAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const roleInfo = $derived(role instanceof Map ? role.get(message.name ?? '') : role);
    const prefix = cssClasses.PREFIX;
    const containerCls = $derived([`${prefix}-container`, message.role === strings.ROLE.USER && view.align === strings.DIALOGUE_ALIGN.LEFT_RIGHT && `${prefix}-container-right`].filter(Boolean).join(' '));
</script>

{#snippet avatarNode()}
    <DialogueAvatar {message} role={roleInfo} />
{/snippet}

{#snippet titleNode()}
    <DialogueTitle {message} role={roleInfo} />
{/snippet}

{#snippet contentNode()}
    {#key Boolean(message.editing)}
        <DialogueContent {message} role={roleInfo} />
    {/key}
{/snippet}

{#snippet actionNode()}
    <DialogueAction {isLastChat} {message} />
{/snippet}

<div class={[`${prefix}-wrapper`, { [`${prefix}-wrapper-selected`]: view.selecting && isSelected }]}>
    {#if view.selecting}
        <div class="{prefix}-checkbox">
            <Checkbox aria-label={locale().locale.selectMessage} checked={isSelected} onChange={(event) => selectChange(event.target.checked, message.id)} />
        </div>
    {/if}
    {#if snippets.fullDialogue}
        {@render snippets.fullDialogue({ class: containerCls, defaultNodes: { avatar: avatarNode, title: titleNode, content: contentNode, action: actionNode }, message, role: roleInfo })}
    {:else}
        <div class={containerCls}>
            {@render avatarNode()}
            <div class="{prefix}-inner">
                {@render titleNode()}
                {@render contentNode()}
                {@render actionNode()}
            </div>
        </div>
    {/if}
</div>
