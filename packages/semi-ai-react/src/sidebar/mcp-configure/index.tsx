import useDefaultProps from '@fibrae/semi-ui-react/_base/use-default-props';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import Container from '../container';
import type { ContainerReactProps } from '../interface';
import MCPConfigureContent, { type MCPConfigureContentReactProps } from './content';

export interface MCPConfigureProps extends ContainerReactProps, MCPConfigureContentReactProps {}

const defaultProps = {} satisfies Partial<MCPConfigureProps>;

export default function MCPConfigure(rawProps: MCPConfigureProps) {
    const props = useDefaultProps('MCPConfigure', rawProps, defaultProps);
    const { options, customOptions, filter, placeholder, onStatusChange, onSearch, onAddClick, onConfigureClick, onEditClick, renderItem, title, ...rest } = props;

    const { locale } = useLocale('Sidebar');

    return (
        <Container {...rest} title={title ?? locale.mcpConfigure}>
            <MCPConfigureContent placeholder={placeholder} customOptions={customOptions} filter={filter} options={options} renderItem={renderItem} onAddClick={onAddClick} onConfigureClick={onConfigureClick} onEditClick={onEditClick} onSearch={onSearch} onStatusChange={onStatusChange} />
        </Container>
    );
}
