import { type Component, type JSX, For, Match, Show, Switch, children, createMemo, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses, strings, type ButtonPart } from '@fibrae/semi-foundation/components/button/constants';
import { buttonClassList, colorfulFill, isAILoading, paddingSides, resolveButtonLooks } from '@fibrae/semi-foundation/components/button/utils';
import type { Size } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/button/button.scss';
import '@fibrae/semi-foundation/components/button/icon-button.scss';
import { IconAILoading, type IconFill } from '@fibrae/semi-icons-solid';
import { type ElementProps, usePopupLayer, useDefaultProps } from '../../base/index';
import { hasContent, mergeRefs, mergeStyles, readGlobalDefaults } from '../../utils/index';
import { useInputGroupContext } from '../input/context';
import SpinIcon from '../spin/icon';
import { useSpecialTrigger } from '../tooltip/context';
import { useAddAreaControl } from '../upload/context';
import { type ButtonLooks, useButtonGroupContext, useGroupItem } from './context';

export type HtmlType = 'button' | 'reset' | 'submit';
export type { Size };
export type Theme = 'solid' | 'borderless' | 'light' | 'outline';
export type Type = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
export type HorizontalPaddingType = 'left' | 'right';

export interface ButtonProps extends ElementProps<'button', 'type'> {
    block?: boolean;
    colorful?: boolean;
    classNames?: Partial<Record<ButtonPart, string>>;
    disabled?: boolean;
    htmlType?: HtmlType;
    /**
     * An element, or an icon component such as `IconAIEditLevel2`. Only a component receives the colorful fill: an
     * element is already rendered when the button reads it, so the fill cannot reach it.
     */
    icon?: JSX.Element | Component<{ fill?: IconFill }>;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    noHorizontalPadding?: boolean | HorizontalPaddingType | HorizontalPaddingType[];
    size?: Size;
    styles?: Partial<Record<ButtonPart, JSX.CSSProperties | string>>;
    theme?: Theme;
    type?: Type;
}

// size, type, theme, disabled and colorful are left out: they resolve own value -> ButtonGroup -> global default
const defaultProps = {
    block: false,
    htmlType: 'button',
    iconPosition: strings.DEFAULT_ICON_POSITION,
    loading: false,
    noHorizontalPadding: false,
} satisfies Partial<ButtonProps>;

const prefix = cssClasses.PREFIX;

// One native button for every state keeps it mounted, and focused, while loading or the icon toggles.
export function renderButton(name: 'Button' | 'IconButton', rawProps: ButtonProps) {
    const props = useDefaultProps(name, rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['block', 'children', 'class', 'classNames', 'colorful', 'disabled', 'htmlType', 'icon', 'iconPosition', 'loading', 'noHorizontalPadding', 'ref', 'size', 'style', 'styles', 'theme', 'type']);

    const group = useButtonGroupContext();
    const layer = usePopupLayer();

    const inGroup = group?.layer === layer ? group : undefined;
    const inputGroup = useInputGroupContext();
    const inInputGroup = inputGroup?.layer === layer ? inputGroup : undefined;
    // The looks read the raw props: the merged ones already hold the global value, which would hide the group's.
    // A ButtonGroup already folds the InputGroup into its looks; a bare button reads the InputGroup itself.
    const global = readGlobalDefaults(name);
    const looks = createMemo<ButtonLooks>(() => resolveButtonLooks({ colorful: rawProps.colorful, disabled: rawProps.disabled, size: rawProps.size, theme: rawProps.theme, type: rawProps.type }, inGroup ? inGroup.view() : inInputGroup?.view(), global));

    const showLoading = () => local.loading && !looks().disabled;
    // children() calls zero-arity functions, which covers control flow such as <Show>, and keeps an icon component
    // as is because it takes props. The spinner replaces the icon, which is not created then: an element created but
    // never inserted has no server markup to hydrate
    const icon = children(() => (showLoading() ? undefined : (local.icon as JSX.Element)));
    const text = children(() => local.children);
    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: looks().disabled, loading: showLoading(), block: local.block }),
        () => local.ref
    );
    const hasText = () => hasContent(text());
    const iconLayout = () => hasContent(icon()) || showLoading();
    const parts = () => (hasText() ? (local.iconPosition === 'left' ? ['icon', 'text'] : ['text', 'icon']) : ['icon']);
    const iconComponent = () => {
        const value = icon();
        return typeof value === 'function' ? (value as Component<{ fill?: IconFill }>) : undefined;
    };
    const iconElement = () => {
        const value = icon();
        return typeof value === 'function' ? undefined : value;
    };

    const style = (): JSX.CSSProperties | string | undefined => {
        const sides = iconLayout() ? paddingSides(local.noHorizontalPadding) : [];
        if (!sides.length) {
            return local.style;
        }
        return mergeStyles(local.style, Object.fromEntries(sides.map((side) => [`padding-${side}`, '0'])));
    };

    // A loading button stays focusable, so its click is stopped in the capture phase, ahead of Solid's delegated
    // handlers and the consumer's native listeners; preventDefault blocks form submit. Solid's delegation skips a disabled button's own handler but not its
    // ancestors', so a click on the content of a disabled button stops here too.
    const guardClick = (event: MouseEvent) => {
        if (local.loading || looks().disabled) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    };

    const setup = (node: HTMLButtonElement) => {
        node.addEventListener('click', guardClick, { capture: true });
        registerTrigger(node);
    };

    const iconView = () => (
        <Switch fallback={iconElement()}>
            <Match when={showLoading() && isAILoading(looks().theme, looks().type, looks().colorful)}>
                <IconAILoading class={`${prefix}-content-loading-icon`} />
            </Match>
            <Match when={showLoading()}>
                <SpinIcon />
            </Match>
            <Match when={iconComponent()}>{(component) => <Dynamic component={component()} fill={looks().colorful ? colorfulFill(looks().theme, looks().type, looks().disabled) : undefined} />}</Match>
        </Switch>
    );

    const textView = () => (
        <span
            class={clsx({
                [`${prefix}-content-left`]: local.iconPosition === 'right',
                [`${prefix}-content-right`]: local.iconPosition === 'left',
            })}
            x-semi-prop="children"
        >
            {text()}
        </span>
    );

    const node = (
        <button
            {...rest}
            ref={mergeRefs(setup, local.ref)}
            type={local.htmlType}
            class={clsx(buttonClassList(prefix, looks(), { block: Boolean(local.block), withIcon: iconLayout(), iconOnly: iconLayout() && !hasText(), loading: Boolean(showLoading()) }), local.class)}
            style={style()}
            aria-disabled={looks().disabled || local.loading}
            disabled={looks().disabled}
        >
            <span class={clsx(`${prefix}-content`, local.classNames?.content)} style={local.styles?.content} x-semi-prop={iconLayout() ? undefined : 'children'}>
                <Show when={iconLayout()} fallback={text()}>
                    <For each={parts()}>{(part) => (part === 'icon' ? iconView() : textView())}</For>
                </Show>
            </span>
        </button>
    );
    useGroupItem(inGroup, node, looks);
    useAddAreaControl();
    return node;
}

export default function Button(props: ButtonProps) {
    return renderButton('Button', props);
}
