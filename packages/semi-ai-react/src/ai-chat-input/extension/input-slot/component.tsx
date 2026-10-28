import { useLayoutEffect, useRef, useState } from 'react';
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import { strings } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import { isSelectionInsideNode } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/input-slot';
import { useEventListener } from '@fibrae/semi-ui-react/hooks';

export default function InputSlotComponent({ editor, node, getPos }: NodeViewProps) {
    // update() is skipped during IME composition (extension/input-slot/index.tsx), so composition events drive state
    // to keep the placeholder off the live IME text
    const [hidePlaceholderInComposition, setHidePlaceholderInComposition] = useState(false);
    const placeholderRef = useRef<HTMLSpanElement>(null);
    const [placeholderWidth, setPlaceholderWidth] = useState<number | undefined>(undefined);

    const isEmpty = node.textContent === strings.ZERO_WIDTH_CHAR;
    const placeholder = node.attrs.placeholder || '';

    // capture phase: ProseMirror may stop propagation
    const editorDom = editor?.view?.dom ?? null;
    const shouldShowPlaceholder = isEmpty && !hidePlaceholderInComposition;

    useEventListener(
        editorDom,
        'compositionstart',
        () => {
            if (isSelectionInsideNode(editor.state.selection, getPos(), node.nodeSize)) {
                setHidePlaceholderInComposition(true);
            }
        },
        { capture: true }
    );

    useEventListener(
        editorDom,
        'compositionend',
        () => {
            return setHidePlaceholderInComposition(false);
        },
        { capture: true }
    );

    useLayoutEffect(() => {
        if (shouldShowPlaceholder && placeholderRef.current) {
            const timer = setTimeout(() => {
                setPlaceholderWidth(placeholderRef.current?.offsetWidth);
            });
            return () => {
                clearTimeout(timer);
            };
        }
        return undefined;
    }, [shouldShowPlaceholder, placeholder]);

    return (
        <NodeViewWrapper as="span" className="input-slot" style={{ minWidth: shouldShowPlaceholder && placeholderWidth ? `${placeholderWidth}px` : undefined }}>
            {/* hidden with display instead of unmounted so the DOM stays stable during IME updates */}
            <span ref={placeholderRef} className="input-slot-placeholder" style={{ display: shouldShowPlaceholder ? undefined : 'none' }} data-placeholder contentEditable={false}>
                {placeholder}
            </span>
            <NodeViewContent as={'span' as any} className="content" />
        </NodeViewWrapper>
    );
}
