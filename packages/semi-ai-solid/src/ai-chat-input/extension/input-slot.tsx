import { createEffect, createSignal, on, onCleanup } from 'solid-js';
import { strings } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import { isSelectionInsideNode } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/input-slot';
import { useEventListener } from '@fibrae/semi-ui-solid/hooks';
import type { SlotViewProps } from './node-view';

export default function InputSlotView(props: SlotViewProps) {
    // The node view skips updates during IME composition, so composition events drive this flag to keep the
    // placeholder off the live IME text
    const [composing, setComposing] = createSignal(false);

    // the absolute placeholder takes no space, so its width becomes the slot's minimum width
    const [placeholderWidth, setPlaceholderWidth] = createSignal<number>();
    let placeholderElement: HTMLSpanElement | undefined;

    const placeholder = () => (props.node().attrs.placeholder as string | null) || '';

    const showPlaceholder = () => props.node().textContent === strings.ZERO_WIDTH_CHAR && !composing();

    createEffect(
        on([showPlaceholder, placeholder], ([show]) => {
            if (!show) {
                return;
            }
            const timer = setTimeout(() => setPlaceholderWidth(placeholderElement?.offsetWidth));
            onCleanup(() => clearTimeout(timer));
        })
    );

    // capture phase: ProseMirror may stop propagation
    useEventListener(
        () => props.view.dom,
        'compositionstart',
        () => {
            if (isSelectionInsideNode(props.editor.state.selection, props.getPos(), props.node().nodeSize)) {
                setComposing(true);
            }
        },
        { capture: true }
    );

    useEventListener(
        () => props.view.dom,
        'compositionend',
        () => setComposing(false),
        { capture: true }
    );

    return (
        <span class="input-slot" style={{ 'white-space': 'normal', 'min-width': showPlaceholder() && placeholderWidth() ? `${placeholderWidth()}px` : undefined }}>
            {/* hidden with display instead of unmounted so the DOM stays stable during IME updates */}
            <span ref={(node) => (placeholderElement = node)} class="input-slot-placeholder" style={{ display: showPlaceholder() ? undefined : 'none' }} contentEditable={false} data-placeholder="">
                {placeholder()}
            </span>
            <span ref={(node) => props.contentRef(node)} class="content" style={{ 'white-space': 'pre-wrap' }} />
        </span>
    );
}
