import { For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses, getDialogueFileKind } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { Reference } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { getFileSuffix, isImageFile } from '@fibrae/semi-ai-foundation/file-suffix';
import { IconCode, IconExcel, IconPdf, IconSendMsgStroked, IconVideo, IconWord } from '@fibrae/semi-icons-solid';
import Image from '@fibrae/semi-ui-solid/image/index';

export interface ReferenceWidgetProps {
    references: Reference[];
}

const prefixCls = cssClasses.PREFIX_REFERENCES;
const referencePrefixCls = cssClasses.PREFIX_REFERENCE;

// A thumbnail replaces the icon for images, so the image kind has none
const ICONS = { word: IconWord, pdf: IconPdf, excel: IconExcel, code: IconCode, video: IconVideo };

function ReferenceIcon(props: { name: string }) {
    const kind = () => getDialogueFileKind(getFileSuffix(props.name));

    const icon = () => {
        const current = kind();
        return current && current !== 'image' ? ICONS[current] : undefined;
    };

    return (
        <Show when={icon()} keyed>
            {(Icon) => (
                <span class={clsx(`${referencePrefixCls}-icon`, `${referencePrefixCls}-icon-${kind()}`)}>
                    <Dynamic component={Icon} size="small" />
                </span>
            )}
        </Show>
    );
}

export function ReferenceWidget(props: ReferenceWidgetProps) {
    return (
        <div class={prefixCls}>
            <For each={props.references}>
                {(reference) => (
                    // Known limitation: background color and items per row are not specified by design yet
                    <div class={referencePrefixCls}>
                        <IconSendMsgStroked />
                        <span class={`${referencePrefixCls}-content`}>
                            <Show when={reference.name}>{(name) => <ReferenceIcon name={name()} />}</Show>
                            <Show when={reference.url && reference.name && isImageFile(reference.name, reference.fileInstance?.type)}>
                                <Image class={`${referencePrefixCls}-img`} alt="" height={16} src={reference.url} width={16} />
                            </Show>
                            <span class={`${referencePrefixCls}-name`}>{reference.name || reference.content}</span>
                        </span>
                    </div>
                )}
            </For>
        </div>
    );
}
