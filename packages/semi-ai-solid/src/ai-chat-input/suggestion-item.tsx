import { type JSX, Show } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import type { RenderSuggestionItemProps, Suggestion } from './interface';

const prefixCls = cssClasses.PREFIX;

interface SuggestionItemProps {
    suggestion: Suggestion;
    active: boolean;
    id: string;
    renderSuggestionItem?: (props: RenderSuggestionItemProps) => JSX.Element;
    onClick: (suggestion: Suggestion) => void;
    onMouseEnter: () => void;
}

export default function SuggestionItem(props: SuggestionItemProps) {
    const className = () => clsx(`${prefixCls}-suggestion-item`, { [`${prefixCls}-suggestion-item-active`]: props.active });

    const handleClick = () => props.onClick(props.suggestion);

    const handleMouseEnter = () => props.onMouseEnter();

    const itemProps: RenderSuggestionItemProps = {
        get suggestion() {
            return props.suggestion;
        },
        get class() {
            return className();
        },
        get id() {
            return props.id;
        },
        role: 'option',
        get 'aria-selected'() {
            return props.active;
        },
        onClick: handleClick,
        onMouseEnter: handleMouseEnter,
    };

    return (
        <Show
            when={props.renderSuggestionItem}
            keyed
            fallback={
                <div id={props.id} class={className()} aria-selected={props.active} role="option" onClick={handleClick} onMouseEnter={handleMouseEnter}>
                    {typeof props.suggestion === 'string' ? props.suggestion : props.suggestion?.content}
                </div>
            }
        >
            {(render) => render(itemProps)}
        </Show>
    );
}
