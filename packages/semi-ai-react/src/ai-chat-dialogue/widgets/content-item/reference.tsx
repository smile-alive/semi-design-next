import clsx from 'clsx';
import { cssClasses, getDialogueFileKind } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { Reference } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { getFileSuffix, isImageFile } from '@fibrae/semi-ai-foundation/file-suffix';
import { IconCode, IconWord, IconExcel, IconPdf, IconSendMsgStroked, IconVideo } from '@fibrae/semi-icons-react';
import Image from '@fibrae/semi-ui-react/image/index';

export interface ReferenceWidgetProps {
    references: Reference[];
}

const prefixCls = cssClasses.PREFIX_REFERENCES;
const referencePrefixCls = cssClasses.PREFIX_REFERENCE;

// A thumbnail replaces the icon for images, so the image kind has none
const ICONS = { word: IconWord, pdf: IconPdf, excel: IconExcel, code: IconCode, video: IconVideo };

export function ReferenceWidget({ references }: ReferenceWidgetProps) {
    const renderReferenceIcon = (name: string) => {
        const kind = getDialogueFileKind(getFileSuffix(name));
        const Icon = kind && kind !== 'image' ? ICONS[kind] : undefined;
        return (
            Icon && (
                <span className={clsx(`${referencePrefixCls}-icon`, `${referencePrefixCls}-icon-${kind}`)}>
                    <Icon size="small" />
                </span>
            )
        );
    };

    const renderReferenceImage = (reference: Reference) => {
        if (reference.url && reference.name && isImageFile(reference.name, reference.fileInstance?.type)) {
            return <Image className={`${referencePrefixCls}-img`} alt="" height={16} src={reference.url} width={16} />;
        }
        return null;
    };

    return (
        <div className={prefixCls}>
            {references.map((reference) => (
                // Known limitation: background color and items per row are not specified by design yet
                <div key={reference.id} className={referencePrefixCls}>
                    <IconSendMsgStroked />
                    <span className={`${referencePrefixCls}-content`}>
                        {renderReferenceIcon(reference.name)}
                        {renderReferenceImage(reference)}
                        <span className={`${referencePrefixCls}-name`}>{reference.name || reference.content}</span>
                    </span>
                </div>
            ))}
        </div>
    );
}
