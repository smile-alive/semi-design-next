import type React from 'react';
import { isValidElement } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
import { IconCopy, IconTick } from '@fibrae/semi-icons-react';
import type { BaseProps } from '../_base/base-component';
import useCopied from '../_base/use-copied';
import useDidUpdate from '../_base/use-did-update';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip/index';
import type { CopyableConfig } from './interface';

const prefixCls = cssClasses.PREFIX;

export interface CopyableProps extends BaseProps {
    content?: string;
    copyTip?: React.ReactNode;
    duration?: number;
    /** Attached to the wrapping span, also around the node of `render` */
    ref?: React.Ref<HTMLSpanElement>;
    successTip?: React.ReactNode;
    icon?: React.ReactNode;
    onCopy?: (e: React.MouseEvent, content: string, res: boolean) => void;
    render?: (copied: boolean, doCopy: (e: React.MouseEvent) => void, configs: CopyableConfig) => React.ReactNode;
}

interface CopyableInnerProps extends CopyableProps {
    /** After the copy action swapped to or from the copied tip, whose width differs: the text beside it is measured again */
    onCopiedChange?: () => void;
}

export function Copyable(props: CopyableInnerProps) {
    const { content = '', copyTip, duration = 3, ref, successTip, icon, onCopy, onCopiedChange, render, style, className } = props;

    const { locale } = useLocale('Typography');

    const [copied, copyText] = useCopied(duration * 1000);

    const copy = (e: React.MouseEvent) => {
        void copyText(content).then((res) => onCopy?.(e, content, res));
    };

    useDidUpdate(copied, () => onCopiedChange?.());

    // the wrapper is what the JS ellipsis measures to reserve room for the custom node
    if (render) {
        return <span ref={ref}>{render(copied, copy, props)}</span>;
    }

    const copyName = (isValidElement<{ 'aria-label'?: string }>(icon) ? icon.props['aria-label'] : undefined) ?? locale.copy;

    // an element tip may have no text (an icon), so it is named; a text tip names the button by itself
    const copiedName = isValidElement<{ 'aria-label'?: string }>(successTip) ? (successTip.props['aria-label'] ?? locale.copied) : undefined;

    const tip =
        successTip === undefined ? (
            <span>
                <IconTick />
                {locale.copied}
            </span>
        ) : (
            successTip
        );

    // one button for both states keeps keyboard focus across the swap
    return (
        <span
            ref={ref}
            className={clsx(className, {
                [`${prefixCls}-action-copy`]: !copied,
                [`${prefixCls}-action-copied`]: copied,
            })}
            style={style}
        >
            <Tooltip condition={!copied} content={copyTip === undefined ? locale.copy : copyTip}>
                <button
                    type="button"
                    className={clsx(`${prefixCls}-action-btn`, {
                        [`${prefixCls}-action-copy-icon`]: !copied && icon == null,
                    })}
                    aria-label={copied ? copiedName : copyName}
                    onClick={copied ? undefined : copy}
                >
                    {copied ? tip : (icon ?? <IconCopy />)}
                </button>
            </Tooltip>
        </span>
    );
}

export default Copyable;
