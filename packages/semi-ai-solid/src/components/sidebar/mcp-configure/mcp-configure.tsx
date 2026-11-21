import { splitProps } from 'solid-js';
import { useDefaultProps } from '@fibrae/semi-ui-solid/base';
import { useLocale } from '@fibrae/semi-ui-solid/primitives';
import Container from '../container';
import type { ContainerSolidProps } from '../interface';
import MCPConfigureContent, { type MCPConfigureContentSolidProps } from './content';

export interface MCPConfigureProps extends Omit<ContainerSolidProps, 'classNames' | 'styles'>, Omit<MCPConfigureContentSolidProps, 'class' | 'style'> {}

const defaultProps = {} satisfies Partial<MCPConfigureProps>;

export default function MCPConfigure(rawProps: MCPConfigureProps) {
    const props = useDefaultProps('MCPConfigure', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['options', 'customOptions', 'filter', 'placeholder', 'onStatusChange', 'onSearch', 'onAddClick', 'onConfigureClick', 'onEditClick', 'renderIcon', 'renderDesc', 'renderItem', 'title', 'classNames', 'styles']);

    const locale = useLocale('Sidebar');

    return (
        <Container {...rest} classNames={local.classNames} styles={local.styles} title={local.title ?? locale().locale.mcpConfigure}>
            <MCPConfigureContent
                placeholder={local.placeholder}
                classNames={local.classNames}
                customOptions={local.customOptions}
                filter={local.filter}
                options={local.options}
                renderDesc={local.renderDesc}
                renderIcon={local.renderIcon}
                renderItem={local.renderItem}
                styles={local.styles}
                onAddClick={local.onAddClick}
                onConfigureClick={local.onConfigureClick}
                onEditClick={local.onEditClick}
                onSearch={local.onSearch}
                onStatusChange={local.onStatusChange}
            />
        </Container>
    );
}
