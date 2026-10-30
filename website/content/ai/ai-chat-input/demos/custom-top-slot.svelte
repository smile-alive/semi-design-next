<script lang="ts">
    import type { Component } from 'svelte';
    import { AIChatInput, type AIChatInputAttachment as Attachment, type AIChatInputReference as Reference } from '@fibrae/semi-ai-svelte';
    import { IconBranch, IconClose, IconCode, IconConnectionPoint2, IconFile, IconFolder, IconGit, IconGlobeStroke, IconSearch, IconTemplateStroked, IconTerminal, IconUpload } from '@fibrae/semi-icons-svelte';

    const { Configure } = AIChatInput;
    const radioButtonProps = [
        { label: '快速', value: 'fast' },
        { label: '深度思考', value: 'think' },
    ];
    const modeIcons: Record<string, Component> = { fast: IconTemplateStroked, think: IconSearch };
    const uploadProps = { action: 'https://api.semi.design/upload' };

    let references = $state<Reference[]>([
        {
            type: 'file',
            id: '1',
            name: 'horizontalScroller.tsx',
            path: 'packages/semi-ui-react/AIChatInput/horizontalScroller.tsx',
        },
        {
            type: 'folder',
            id: '2',
            name: 'AIChatInput',
            path: 'packages/semi-ui-react/AIChatInput',
        },
        {
            type: 'web',
            id: '3',
            name: 'web',
        },
        {
            type: 'change',
            id: '4',
            name: 'recentChange',
        },
        {
            type: 'branch',
            id: '5',
            name: 'Branch',
            detail: 'Diff with Main Branch',
            branch: 'feat/aichatinput',
            targetBranch: 'feat/targetBranch',
        },
        {
            type: 'terminal',
            id: '6',
            name: 'From 1-2',
            from: 1,
            to: 2,
        },
    ]);

    const isImageType = ({ name = '', fileInstance }: Attachment) => {
        const PIC_PREFIX = 'image/';
        const PIC_SUFFIX_ARRAY = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
        const suffix = name.split('.').pop() ?? '';
        let result = false;
        const type = fileInstance?.type ?? '';
        if (type.startsWith(PIC_PREFIX)) {
            result = true;
        } else if (PIC_SUFFIX_ARRAY.includes(suffix)) {
            result = true;
        }
        return result;
    };

    const refTypeToIconMap: Record<string, Component> = {
        file: IconFile,
        folder: IconFolder,
        branch: IconBranch,
        terminal: IconTerminal,
        web: IconGlobeStroke,
        change: IconConnectionPoint2,
        git: IconGit,
        code: IconCode,
    };

    const onReferenceDelete = (reference: Reference) => {
        references = references.filter((item) => item.id !== reference.id);
    };
</script>

<AIChatInput class="aiChatInput-customTopSlot" {onReferenceDelete} placeholder="自定义渲染顶部内容，可用于渲染上传内容、引用内容" {references} showReference={false} showUploadFile={false} style="margin: 12px" {uploadProps}>
    {#snippet topSlot({ attachments, references: items, onReferenceDelete: deleteReference, onUploadFileDelete })}
        <div class="ai-chat-input-topSlot">
            {#each items as item (item.id)}
                {@const Icon = refTypeToIconMap[item.type ?? '']}
                <div class="item">
                    <span class="item-icon">
                        {#if Icon}
                            <Icon class="item-left item-icon" size="small" />
                        {/if}
                        <button aria-label="删除" class="item-icon-delete" type="button" onclick={() => deleteReference(item)}>
                            <IconClose size="small" />
                        </button>
                    </span>
                    <span class="item-content">
                        {item.name}
                        {#if item.type === 'branch'}
                            <span class="detail">{item.detail}</span>
                        {/if}
                    </span>
                </div>
            {/each}
            {#each attachments as item (item.uid)}
                <div class="item">
                    <span class="item-icon">
                        {#if isImageType(item)}
                            <img alt={item.name} class="item-image item-left" src={item.url} />
                        {:else}
                            <IconUpload class="item-left item-icon" size="small" />
                        {/if}
                        <button aria-label="删除" class="item-icon-delete" type="button" onclick={() => onUploadFileDelete(item)}>
                            <IconClose size="small" />
                        </button>
                    </span>
                    <span class="item-content">{item.name}</span>
                </div>
            {/each}
        </div>
    {/snippet}
    {#snippet configureArea()}
        <Configure.RadioButton field="mode" initValue="fast" options={radioButtonProps}>
            <!-- the icon is the only label, so it carries the name -->
            {#snippet label({ option })}
                {@const Icon = modeIcons[String(option.value)]}
                <Icon aria-label={option.label} />
            {/snippet}
        </Configure.RadioButton>
    {/snippet}
</AIChatInput>
