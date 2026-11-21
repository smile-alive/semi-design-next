import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
import { useDefaultProps } from '@fibrae/semi-ui-react/base';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import Container from '../container';
import type { ContainerReactProps } from '../interface';
import Content, { type ContentProps } from './content';

const prefixCls = cssClasses.ANNOTATION;

export interface AnnotationProps extends Omit<ContainerReactProps, 'onChange' | 'onClick' | 'classNames' | 'styles'>, Omit<ContentProps, 'title'> {}

const defaultProps = {} satisfies Partial<AnnotationProps>;

function Annotation(rawProps: AnnotationProps) {
    const { activeKey, info, onChange, onClick, renderItem, title, className, classNames, styles, ...rest } = useDefaultProps('Annotation', rawProps, defaultProps);

    const { locale } = useLocale('Sidebar');

    return (
        <Container {...rest} className={clsx(prefixCls, className)} classNames={classNames} styles={styles} title={title ?? locale.annotationTitle}>
            <Content classNames={classNames} styles={styles} activeKey={activeKey} info={info} renderItem={renderItem} onChange={onChange} onClick={onClick} />
        </Container>
    );
}

export default Object.assign(Annotation, { AnnotationContent: Content });
