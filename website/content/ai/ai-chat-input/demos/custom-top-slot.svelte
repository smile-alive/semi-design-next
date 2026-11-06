<script lang="ts">
    import type { Component } from 'svelte';
    import { AIChatInput, type AIChatInputAttachment as Attachment, type AIChatInputReference as Reference } from '@fibrae/semi-ai-svelte';
    import { IconBranch, IconClose, IconCode, IconConnectionPoint2, IconFile, IconFolder, IconGit, IconGlobeStroke, IconSearch, IconTemplateStroked, IconTerminal, IconUpload } from '@fibrae/semi-icons-svelte';

    const radioButtonProps = [
        { label: '快速', value: 'fast' },
        { label: '深度思考', value: 'think' },
    ];
    const modeIcons: Record<string, Component> = { fast: IconTemplateStroked, think: IconSearch };
    const uploadProps = { action: 'https://api.semi.design/upload' };

    const customReferences: Reference[] = [
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
    ];

    let reference = $state(customReferences);

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

    const onReferenceDelete = (deleted: Reference) => {
        reference = reference.filter((item) => item.id !== deleted.id);
    };
</script>

<AIChatInput class="aiChatInput-customTopSlot" {onReferenceDelete} placeholder="自定义渲染顶部内容，可用于渲染上传内容、引用内容" references={reference} showReference={false} showUploadFile={false} style="margin: 12px" {uploadProps}>
    {#snippet topSlot(topSlot)}
        <div class="ai-chat-input-topSlot">
            {#each topSlot.references as item (item.id)}
                {@const Icon = refTypeToIconMap[item.type ?? '']}
                <div class="item">
                    <span class="item-icon">
                        {#if Icon}
                            <Icon class="item-left item-icon" size="small" />
                        {/if}
                        <button aria-label="删除" class="item-icon-delete" type="button" onclick={() => topSlot.onReferenceDelete(item)}>
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
            {#each topSlot.attachments as item (item.uid)}
                <div class="item">
                    <span class="item-icon">
                        {#if isImageType(item)}
                            <img alt={item.name} class="item-image item-left" src={item.url} />
                        {:else}
                            <IconUpload class="item-left item-icon" size="small" />
                        {/if}
                        <button aria-label="删除" class="item-icon-delete" type="button" onclick={() => topSlot.onUploadFileDelete(item)}>
                            <IconClose size="small" />
                        </button>
                    </span>
                    <span class="item-content">{item.name}</span>
                </div>
            {/each}
        </div>
    {/snippet}
    {#snippet configureArea()}
        <AIChatInput.Configure.RadioButton field="mode" initValue="fast" options={radioButtonProps}>
            <!-- the icon is the only label, so it carries the name -->
            {#snippet label(label)}
                {@const Icon = modeIcons[String(label.option.value)]}
                <Icon aria-label={label.option.label} />
            {/snippet}
        </AIChatInput.Configure.RadioButton>
    {/snippet}
</AIChatInput>
