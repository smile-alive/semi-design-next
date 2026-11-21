import { useDefaultProps } from '@fibrae/semi-ui-react/base';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import Container from '../container';
import type { ContainerReactProps } from '../interface';
import MCPConfigureContent, { type MCPConfigureContentReactProps } from './content';

export interface MCPConfigureProps extends Omit<ContainerReactProps, 'classNames' | 'styles'>, MCPConfigureContentReactProps {}

const defaultProps = {} satisfies Partial<MCPConfigureProps>;

export default function MCPConfigure(rawProps: MCPConfigureProps) {
    const { options, customOptions, filter, placeholder, onStatusChange, onSearch, onAddClick, onConfigureClick, onEditClick, renderItem, title, classNames, styles, ...rest } = useDefaultProps('MCPConfigure', rawProps, defaultProps);

    const { locale } = useLocale('Sidebar');

    return (
        <Container {...rest} classNames={classNames} styles={styles} title={title ?? locale.mcpConfigure}>
            <MCPConfigureContent
                classNames={classNames}
                styles={styles}
                placeholder={placeholder}
                customOptions={customOptions}
                filter={filter}
                options={options}
                renderItem={renderItem}
                onAddClick={onAddClick}
                onConfigureClick={onConfigureClick}
                onEditClick={onEditClick}
                onSearch={onSearch}
                onStatusChange={onStatusChange}
            />
        </Container>
    );
}
