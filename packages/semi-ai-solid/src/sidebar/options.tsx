import { For, Show } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
import Button from '@fibrae/semi-ui-solid/button/index';
import type { OptionProps } from './interface';

const prefixCls = cssClasses.OPTIONS;

export default function Options(props: OptionProps) {
    // renderOptionItem always gets a callable handler, even when the owner passes no onActiveOptionChange
    const handleChange = (e: MouseEvent, key: string) => props.onChange?.(e, key);

    return (
        <div class={prefixCls}>
            <For each={props.options}>
                {(option) => (
                    <Show
                        when={props.renderOptionItem}
                        keyed
                        fallback={
                            <Button class={clsx(`${prefixCls}-button`, { [`${prefixCls}-normal`]: props.activeKey !== option.key })} aria-pressed={props.activeKey === option.key} icon={props.renderOptionIcon?.(option)} onClick={(e) => handleChange(e, option.key)}>
                                {option.name}
                            </Button>
                        }
                    >
                        {(render) => render(option, handleChange)}
                    </Show>
                )}
            </For>
        </div>
    );
}
