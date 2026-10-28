import { splitProps } from 'solid-js';
import useDefaultProps from '@fibrae/semi-ui-solid/_base/use-default-props';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import Container from '../container';
import type { ContainerSolidProps } from '../interface';
import MCPConfigureContent, { type MCPConfigureContentSolidProps } from './content';

export interface MCPConfigureProps extends ContainerSolidProps, Omit<MCPConfigureContentSolidProps, 'class' | 'style'> {}

const defaultProps = {} satisfies Partial<MCPConfigureProps>;

export default function MCPConfigure(rawProps: MCPConfigureProps) {
    const props = useDefaultProps('MCPConfigure', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['options', 'customOptions', 'filter', 'placeholder', 'onStatusChange', 'onSearch', 'onAddClick', 'onConfigureClick', 'onEditClick', 'renderIcon', 'renderDesc', 'renderItem', 'title']);

    const locale = useLocale('Sidebar');

    return (
        <Container {...rest} title={local.title ?? locale().locale.mcpConfigure}>
            <MCPConfigureContent
                placeholder={local.placeholder}
                customOptions={local.customOptions}
                filter={local.filter}
                options={local.options}
                renderDesc={local.renderDesc}
                renderIcon={local.renderIcon}
                renderItem={local.renderItem}
                onAddClick={local.onAddClick}
                onConfigureClick={local.onConfigureClick}
                onEditClick={local.onEditClick}
                onSearch={local.onSearch}
                onStatusChange={local.onStatusChange}
            />
        </Container>
    );
}
