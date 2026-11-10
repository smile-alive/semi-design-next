import { type Accessor, type JSX, For, Show, children, createMemo, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/button/constants';
import { groupLineClass, inheritGroupLooks } from '@fibrae/semi-foundation/components/button/utils';
import '@fibrae/semi-foundation/components/button/button.scss';
import type { ElementProps } from '../../base/element-props';
import { usePopupLayer } from '../../base/popup-layer';
import useDefaultProps from '../../base/use-default-props';
import { useInputGroupContext } from '../input/context';
import type { Size, Theme, Type } from './button';
import { type ButtonGroupContextValue, type ButtonLooks, ButtonGroupContext, useButtonGroupContext } from './context';

export interface ButtonGroupProps extends ElementProps<'div'> {
    colorful?: boolean;
    disabled?: boolean;
    size?: Size;
    theme?: Theme;
    type?: Type;
}

const prefix = cssClasses.PREFIX;

// Rendered inside the provider: Solid context follows the owner a child is created under, so the buttons must be
// created here rather than in the group's own body
function GroupItems(props: { buttons: WeakMap<object, Accessor<ButtonLooks>>; children: JSX.Element }) {
    const resolved = children(() => props.children);

    const items = () => resolved.toArray().filter((item) => item != null && typeof item !== 'boolean' && item !== '');

    // Only a direct Button or IconButton child gets a line, following its effective looks; the buttons registered
    // their nodes while `resolved` created them
    const lineClass = (item: unknown, index: number) => {
        const looks = index < items().length - 1 ? props.buttons.get(item as object)?.() : undefined;
        return looks && groupLineClass(prefix, looks);
    };

    return (
        <For each={items()}>
            {(item, index) => (
                <>
                    {item}
                    <Show when={lineClass(item, index())}>{(line) => <span class={line()} />}</Show>
                </>
            )}
        </For>
    );
}

export default function ButtonGroup(rawProps: ButtonGroupProps) {
    const props = useDefaultProps('ButtonGroup', rawProps, {});
    const [local, rest] = splitProps(props, ['children', 'class', 'colorful', 'disabled', 'size', 'theme', 'type']);

    const outer = useButtonGroupContext();
    const inputGroupContext = useInputGroupContext();
    const layer = usePopupLayer();

    const parent = outer?.layer === layer ? outer : undefined;
    const inputGroup = inputGroupContext?.layer === layer ? inputGroupContext : undefined;

    // The group's global defaults come after an enclosing group, so the raw props meet the enclosing group first
    const view = createMemo(() => inheritGroupLooks(inheritGroupLooks(rawProps, parent ? parent.view() : inputGroup?.view()), local));
    const context: ButtonGroupContextValue = { view, layer, buttons: new WeakMap() };

    return (
        <div role="group" {...rest} class={clsx(`${prefix}-group`, local.class)}>
            <ButtonGroupContext.Provider value={context}>
                <GroupItems buttons={context.buttons}>{local.children}</GroupItems>
            </ButtonGroupContext.Provider>
        </div>
    );
}
