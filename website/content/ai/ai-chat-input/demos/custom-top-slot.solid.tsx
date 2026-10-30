import { For, Show, type Component, createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { AIChatInput, type AIChatInputAttachment as Attachment, type AIChatInputElement, type AIChatInputReference as Reference, type AIChatInputRenderTopSlotProps as RenderTopSlotProps } from '@fibrae/semi-ai-solid';
import { IconClose, IconUpload, IconFile, IconFolder, IconBranch, IconTerminal, IconGlobeStroke, IconConnectionPoint2, IconTemplateStroked, IconSearch, IconGit, IconCode, type IconProps } from '@fibrae/semi-icons-solid';

const { Configure } = AIChatInput;
const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: '12px' };

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

// Icon components rather than elements: the top slot renders each one through Dynamic, with its own props
const refTypeToIconMap = new Map<string, Component<IconProps>>([
    ['file', IconFile],
    ['folder', IconFolder],
    ['branch', IconBranch],
    ['terminal', IconTerminal],
    ['web', IconGlobeStroke],
    ['change', IconConnectionPoint2],
    ['git', IconGit],
    ['code', IconCode],
]);

function isImageType({ name = '', fileInstance }: Attachment) {
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
}

// the icon is the only visible label, so the label text becomes its name
const radioButtonProps = [
    { label: '快速', value: 'fast' },
    { label: '深度思考', value: 'think' },
];

const radioIcons: Record<string, Component<IconProps>> = {
    fast: IconTemplateStroked,
    think: IconSearch,
};

export default function AIChatInputDemo() {
    let input: AIChatInputElement | undefined;
    const [reference, setReference] = createSignal(customReferences);

    const renderLeftMenu = () => (
        <>
            <Configure.RadioButton options={radioButtonProps} renderLabel={(option) => <Dynamic component={radioIcons[String(option.value)]} aria-label={String(option.label)} />} initValue="fast" field="mode" />
        </>
    );

    const renderTopSlot = (slot: RenderTopSlotProps) => (
        <div class="ai-chat-input-topSlot">
            <For each={slot.references}>
                {(item) => (
                    <div class="item">
                        <span class="item-icon">
                            <Show when={item.type && refTypeToIconMap.get(item.type)} keyed>
                                {(icon) => <Dynamic component={icon} size="small" class="item-left item-icon" />}
                            </Show>
                            <button type="button" class="item-icon-delete" aria-label="删除" onClick={() => setReference((list) => list.filter((ref) => ref.id !== item.id))}>
                                <IconClose size="small" />
                            </button>
                        </span>
                        <span class="item-content">
                            {item.name}
                            <Show when={item.type === 'branch'}>
                                <span class="detail">{item.detail}</span>
                            </Show>
                        </span>
                    </div>
                )}
            </For>
            <For each={slot.attachments}>
                {(item) => (
                    <div class="item">
                        <span class="item-icon">
                            <Show when={isImageType(item)} fallback={<IconUpload size="small" class="item-left item-icon" />}>
                                <img class="item-image item-left" src={item.url} alt={item.name} />
                            </Show>
                            <button type="button" class="item-icon-delete" aria-label="删除" onClick={() => input?.deleteUploadFile(item)}>
                                <IconClose size="small" />
                            </button>
                        </span>
                        <span class="item-content">{item.name}</span>
                    </div>
                )}
            </For>
        </div>
    );

    return (
        <AIChatInput
            class="aiChatInput-customTopSlot"
            renderTopSlot={renderTopSlot}
            references={reference()}
            showUploadFile={false}
            showReference={false}
            renderConfigureArea={renderLeftMenu}
            ref={(element) => (input = element)}
            uploadProps={uploadProps}
            style={outerStyle}
            placeholder="自定义渲染顶部内容，可用于渲染上传内容、引用内容"
        />
    );
}
