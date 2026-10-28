import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import type { RenderSkillItemProps, Skill } from './interface';

const prefixCls = cssClasses.PREFIX;

interface SkillItemProps {
    skill?: Skill;
    renderSkillItem?: (props: RenderSkillItemProps) => ReactNode;
    isActive?: boolean;
    id: string;
    onClick?: (skill: Skill) => void;
    index?: number;
    onMouseEnter?: (index: number) => void;
}

function SkillItem({ skill, onClick, isActive, renderSkillItem, onMouseEnter, index, id }: SkillItemProps) {
    const className = clsx(`${prefixCls}-skill-item`, {
        [`${prefixCls}-skill-item-active`]: isActive,
    });

    const handleClick = () => onClick(skill);

    const handleMouseEnter = () => onMouseEnter?.(index);

    if (renderSkillItem && typeof renderSkillItem === 'function') {
        return renderSkillItem({
            skill: skill,
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
            {skill.icon}
            <div className={`${prefixCls}-skill-item-content`}>{skill.label}</div>
        </div>
    );
}

export default React.memo(SkillItem);
