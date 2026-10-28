import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
import useDefaultProps from '@fibrae/semi-ui-react/_base/use-default-props';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import Container from '../container';
import type { ContainerReactProps } from '../interface';
import Content, { type ContentProps } from './content';

const prefixCls = cssClasses.ANNOTATION;

export interface AnnotationProps extends Omit<ContainerReactProps, 'onChange' | 'onClick'>, Omit<ContentProps, 'title'> {}

const defaultProps = {} satisfies Partial<AnnotationProps>;

function Annotation(rawProps: AnnotationProps) {
    const props = useDefaultProps('Annotation', rawProps, defaultProps);
    const { activeKey, info, onChange, onClick, renderItem, title, className, ...rest } = props;

    const { locale } = useLocale('Sidebar');

    return (
        <Container {...rest} className={clsx(prefixCls, className)} title={title ?? locale.annotationTitle}>
            <Content activeKey={activeKey} info={info} renderItem={renderItem} onChange={onChange} onClick={onClick} />
        </Container>
    );
}

export default Object.assign(Annotation, { AnnotationContent: Content });
