import { Show } from 'solid-js';
import { IconClose } from '@fibrae/semi-icons-solid';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import type { SlotViewProps } from './node-view';

export default function SkillSlotView(props: SlotViewProps) {
    const locale = useLocale('AIChatInput');

    const label = () => (props.node().attrs.label as string | null) ?? (props.node().attrs.value as string | null) ?? '';

    // stopped: the container's click would move focus to the editor's end
    const handleRemove = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        props.deleteNode();
        // the button leaves with the slot, so focus would otherwise fall to the body
        props.editor.commands.focus();
    };

    return (
        <Show when={label() !== ''}>
            <span class="skill-slot-wrapper" style={{ 'white-space': 'normal' }}>
                <span class="skill-slot">
                    {label()}
                    <button type="button" class="skill-slot-delete" aria-label={locale().locale.removeSkill} onClick={handleRemove}>
                        <IconClose />
                    </button>
                </span>
            </span>
        </Show>
    );
}
