import { splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
import { useDefaultProps } from '@fibrae/semi-ui-solid/base';
import { useLocale } from '@fibrae/semi-ui-solid/primitives';
import Container from '../container';
import type { ContainerSolidProps } from '../interface';
import Content, { type ContentProps } from './content';

const prefixCls = cssClasses.ANNOTATION;

export interface AnnotationProps extends Omit<ContainerSolidProps, 'onChange' | 'onClick' | 'classNames' | 'styles'>, Pick<ContentProps, 'classNames' | 'styles' | 'activeKey' | 'info' | 'renderItem' | 'onChange' | 'onClick'> {
    /** AnnotationContent's `renderHeader`, renamed beside the container's `renderHeader` */
    renderInfoHeader?: ContentProps['renderHeader'];
}

const defaultProps = {} satisfies Partial<AnnotationProps>;

function Annotation(rawProps: AnnotationProps) {
    const props = useDefaultProps('Annotation', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['activeKey', 'info', 'onChange', 'onClick', 'renderInfoHeader', 'renderItem', 'title', 'class', 'classNames', 'styles']);

    const locale = useLocale('Sidebar');

    return (
        <Container {...rest} class={clsx(prefixCls, local.class)} classNames={local.classNames} styles={local.styles} title={local.title ?? locale().locale.annotationTitle}>
            <Content activeKey={local.activeKey} classNames={local.classNames} info={local.info} styles={local.styles} renderHeader={local.renderInfoHeader} renderItem={local.renderItem} onChange={local.onChange} onClick={local.onClick} />
        </Container>
    );
}

export default Object.assign(Annotation, { AnnotationContent: Content });
