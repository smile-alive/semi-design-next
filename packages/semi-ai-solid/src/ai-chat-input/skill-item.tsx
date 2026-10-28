import { type JSX, Show } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import type { RenderSkillItemProps, Skill } from './interface';

const prefixCls = cssClasses.PREFIX;

interface SkillItemProps {
    skill: Skill;
    active: boolean;
    id: string;
    renderSkillIcon?: (skill: Skill) => JSX.Element;
    renderSkillItem?: (props: RenderSkillItemProps) => JSX.Element;
    onClick: (skill: Skill) => void;
    onMouseEnter: () => void;
}

export default function SkillItem(props: SkillItemProps) {
    const className = () => clsx(`${prefixCls}-skill-item`, { [`${prefixCls}-skill-item-active`]: props.active });

    const handleClick = () => props.onClick(props.skill);

    const handleMouseEnter = () => props.onMouseEnter();

    const itemProps: RenderSkillItemProps = {
        get skill() {
            return props.skill;
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
            when={props.renderSkillItem}
            keyed
            fallback={
                <div id={props.id} class={className()} aria-selected={props.active} role="option" onClick={handleClick} onMouseEnter={handleMouseEnter}>
                    {props.renderSkillIcon?.(props.skill)}
                    <div class={`${prefixCls}-skill-item-content`}>{props.skill.label}</div>
                </div>
            }
        >
            {(render) => render(itemProps)}
        </Show>
    );
}
