<script lang="ts">
    import { onMount } from 'svelte';
    import { IconBolt, IconUser } from '@fibrae/semi-icons-svelte';
    import Button from '../../button/button.svelte';
    import FileCard from '../file-card.svelte';
    import type { UploadFileItemSlotProps, UploadHandle, UploadProps } from '../interface';
    import Upload from '../upload.svelte';

    // `snippets` names the snippets passed, so absence stays observable; `seen` is a plain object, not state, so a
    // snippet can record what it received while rendering
    let {
        store,
        seen,
        onReady,
    }: {
        store: { props: UploadProps; trigger: 'button' | 'text' | 'plus' | 'icon' | 'none'; snippets: string[] };
        seen: Record<string, unknown[]>;
        onReady?: (handle: UploadHandle) => void;
    } = $props();

    let upload = $state<UploadHandle>();

    const has = (name: string) => store.snippets.includes(name);

    const record = (name: string, props: UploadFileItemSlotProps) => {
        (seen[name] ??= []).push([props.file.url, props.index]);
        return name;
    };

    onMount(() => onReady?.(upload as UploadHandle));
</script>

{#snippet button()}<Button theme="light">点击上传</Button>{/snippet}
{#snippet text()}<span>上传文件</span>{/snippet}
{#snippet plus()}+{/snippet}
{#snippet icon()}<IconUser />{/snippet}

{#snippet dragIcon()}<IconBolt />{/snippet}
{#snippet dragMainText()}<span>Drop files here to upload or Click to browse files</span>{/snippet}
{#snippet dragSubText()}<span>Only support jpeg / pdf</span>{/snippet}
{#snippet prompt()}<span>Some info for extra text</span>{/snippet}
{#snippet validateMessage()}test{/snippet}
{#snippet fileListTitle()}我的文件{/snippet}
{#snippet fileListHeader(props: { fileList: unknown[]; onClear: () => void; clearText: string })}
    <button type="button" onclick={props.onClear}>{`${props.fileList.length} ${props.clearText}`}</button>
{/snippet}

{#snippet fileItemPlain(props: UploadFileItemSlotProps)}<div class="customRender">{props.file.name}</div>{/snippet}
{#snippet fileItemCard(props: UploadFileItemSlotProps)}
    {#if props.file.uid !== '2'}<FileCard {...props} class="via-slot" />{/if}
{/snippet}
{#snippet fileItemReplace(props: UploadFileItemSlotProps)}
    <button type="button" onclick={props.onReplace}>{`replace ${props.file.name}`}</button>
{/snippet}
{#snippet fileItemPreview(props: UploadFileItemSlotProps)}
    <button type="button" onclick={props.onPreviewClick}>{`preview ${props.file.name}`}</button>
{/snippet}

{#snippet previewFile()}<div data-testid="custom-preview">2</div>{/snippet}
{#snippet previewText()}data:image/png;base64,...{/snippet}
{#snippet thumbnail(props: UploadFileItemSlotProps)}<img alt={props.file.name} class="custom-thumbnail" src={props.file.url} />{/snippet}
{#snippet picInfo(props: UploadFileItemSlotProps)}<span class="custom-pic-info">{props.file.name}</span>{/snippet}
{#snippet picPreviewIcon()}<span class="custom-preview-icon">Preview</span>{/snippet}
{#snippet picClose(props: { class: string; onRemove: (event: MouseEvent) => void })}
    <button class={props.class} type="button" onclick={props.onRemove}>X</button>
{/snippet}
{#snippet fileOperation()}<span class="custom-operation">Op</span>{/snippet}
{#snippet fileValidateMessage(props: UploadFileItemSlotProps)}<em class="custom-msg">{`${props.validateMessage}!`}</em>{/snippet}

{#snippet recordedThumbnail(props: UploadFileItemSlotProps)}<span>{record('thumbnail', props)}</span>{/snippet}
{#snippet recordedPicInfo(props: UploadFileItemSlotProps)}<span>{record('picInfo', props)}</span>{/snippet}
{#snippet recordedPicPreviewIcon(props: UploadFileItemSlotProps)}<span>{record('picPreviewIcon', props)}</span>{/snippet}
{#snippet recordedFileOperation(props: UploadFileItemSlotProps)}<span>{record('fileOperation', props)}</span>{/snippet}
{#snippet recordedPreviewFile(props: UploadFileItemSlotProps)}<span>{record('previewFile', props)}</span>{/snippet}

<Upload
    bind:this={upload}
    {...store.props}
    children={{ button, text, plus, icon, none: undefined }[store.trigger]}
    dragIcon={has('dragIcon') ? dragIcon : undefined}
    dragMainText={has('dragMainText') ? dragMainText : undefined}
    dragSubText={has('dragSubText') ? dragSubText : undefined}
    fileItem={has('fileItem') ? fileItemPlain : has('fileItemCard') ? fileItemCard : has('fileItemReplace') ? fileItemReplace : has('fileItemPreview') ? fileItemPreview : undefined}
    fileListHeader={has('fileListHeader') ? fileListHeader : undefined}
    fileListTitle={has('fileListTitle') ? fileListTitle : undefined}
    fileOperation={has('fileOperation') ? fileOperation : has('recordedFileOperation') ? recordedFileOperation : undefined}
    fileValidateMessage={has('fileValidateMessage') ? fileValidateMessage : undefined}
    picClose={has('picClose') ? picClose : undefined}
    picInfo={has('picInfo') ? picInfo : has('recordedPicInfo') ? recordedPicInfo : undefined}
    picPreviewIcon={has('picPreviewIcon') ? picPreviewIcon : has('recordedPicPreviewIcon') ? recordedPicPreviewIcon : undefined}
    previewFile={has('previewFile') ? previewFile : has('previewText') ? previewText : has('recordedPreviewFile') ? recordedPreviewFile : undefined}
    prompt={has('prompt') ? prompt : undefined}
    thumbnail={has('thumbnail') ? thumbnail : has('recordedThumbnail') ? recordedThumbnail : undefined}
    validateMessage={has('validateMessage') ? validateMessage : undefined}
/>
