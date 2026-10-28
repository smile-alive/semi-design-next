import { Index, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { Annotation } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { IconChevronRight } from '@fibrae/semi-icons-solid';
import callHandler from '@fibrae/semi-ui-solid/_base/call-handler';
import type { ElementProps } from '@fibrae/semi-ui-solid/_base/element-props';
import Avatar, { AvatarGroup } from '@fibrae/semi-ui-solid/avatar/index';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';

export interface AnnotationItemProps {
    title?: string;
    logo?: string;
    url?: string;
    detail?: string;
}

export interface AnnotationWidgetProps extends ElementProps<'div', 'onClick'> {
    maxCount: number;
    annotation: AnnotationItemProps[] | Annotation[];
    onClick?: (e: MouseEvent | KeyboardEvent, item: AnnotationItemProps[]) => void;
    description?: string;
}

const prefixCls = cssClasses.PREFIX_ANNOTATION;

export function AnnotationWidget(props: AnnotationWidgetProps) {
    const [local, rest] = splitProps(props, ['annotation', 'description', 'maxCount', 'onClick', 'class', 'onKeyDown']);

    const locale = useLocale('AIChatDialogue');

    const click = (e: MouseEvent | KeyboardEvent) => local.onClick?.(e, local.annotation as AnnotationItemProps[]);

    return (
        <div
            {...rest}
            class={clsx(`${prefixCls}-wrapper`, local.class)}
            role="button"
            tabIndex={0}
            onClick={click}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    click(e);
                }
                callHandler(local.onKeyDown, e);
            }}
        >
            <div class={`${prefixCls}-content`}>
                <AvatarGroup
                    maxCount={local.maxCount}
                    overlapFrom="end"
                    renderMore={(restNumber) => (
                        <Avatar class={`${prefixCls}-content-logo-renderMore`} alt={locale().locale.more} size="extra-extra-small">
                            {`+${restNumber}`}
                        </Avatar>
                    )}
                    size="extra-extra-small"
                >
                    {/* positions, not identities: a streamed chunk replaces each annotation with a new object */}
                    <Index each={local.annotation as AnnotationItemProps[]}>
                        {(item) => (
                            <Show when={item().logo}>
                                <Avatar class={`${prefixCls}-content-logo`} alt={item().title} src={item().logo} />
                            </Show>
                        )}
                    </Index>
                </AvatarGroup>
                <div class={`${prefixCls}-content-description`}>{local.description || `${local.annotation.length} ${locale().locale.annotationText}`}</div>
                <div class={`${prefixCls}-content-icon`}>
                    <IconChevronRight />
                </div>
            </div>
        </div>
    );
}
