import { splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
import useDefaultProps from '@fibrae/semi-ui-solid/_base/use-default-props';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import Container from '../container';
import type { ContainerSolidProps } from '../interface';
import Content, { type ContentProps } from './content';

const prefixCls = cssClasses.ANNOTATION;

// Element props come from the container, where the rest of the props land
export interface AnnotationProps extends Omit<ContainerSolidProps, 'onChange' | 'onClick'>, Pick<ContentProps, 'activeKey' | 'info' | 'renderItem' | 'onChange' | 'onClick'> {
    /** AnnotationContent's `renderHeader`, renamed beside the container's `renderHeader` */
    renderInfoHeader?: ContentProps['renderHeader'];
}

const defaultProps = {} satisfies Partial<AnnotationProps>;

function Annotation(rawProps: AnnotationProps) {
    const props = useDefaultProps('Annotation', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['activeKey', 'info', 'onChange', 'onClick', 'renderInfoHeader', 'renderItem', 'title', 'class']);

    const locale = useLocale('Sidebar');

    return (
        <Container {...rest} class={clsx(prefixCls, local.class)} title={local.title ?? locale().locale.annotationTitle}>
            <Content activeKey={local.activeKey} info={local.info} renderHeader={local.renderInfoHeader} renderItem={local.renderItem} onChange={local.onChange} onClick={local.onClick} />
        </Container>
    );
}

export default Object.assign(Annotation, { AnnotationContent: Content });
