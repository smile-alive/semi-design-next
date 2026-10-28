import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import type { Suggestion, RenderSuggestionItemProps } from './interface';

const prefixCls = cssClasses.PREFIX;

interface SuggestionItemProps {
    suggestion: Suggestion;
    isActive?: boolean;
    id: string;
    renderSuggestionItem?: (props: RenderSuggestionItemProps) => ReactNode;
    onClick?: (suggestion: Suggestion) => void;
    index?: number;
    onMouseEnter?: (index: number) => void;
}

function SuggestionItem({ suggestion, onClick, isActive, renderSuggestionItem, onMouseEnter, index, id }: SuggestionItemProps) {
    const content = typeof suggestion === 'string' ? suggestion : suggestion?.content;

    const className = clsx(`${prefixCls}-suggestion-item`, {
        [`${prefixCls}-suggestion-item-active`]: isActive,
    });

    const handleClick = () => onClick?.(suggestion);

    const handleMouseEnter = () => onMouseEnter?.(index);

    if (renderSuggestionItem && typeof renderSuggestionItem === 'function') {
        return renderSuggestionItem({
            suggestion,
            className,
            id,
            role: 'option',
            'aria-selected': Boolean(isActive),
            onClick: handleClick,
            onMouseEnter: handleMouseEnter,
        });
    }

    return (
        <div id={id} className={className} aria-selected={Boolean(isActive)} role="option" onClick={handleClick} onMouseEnter={handleMouseEnter}>
            {content}
        </div>
    );
}

export default React.memo(SuggestionItem);
