<script lang="ts" module>
    import type { AnnotationInfo } from '../annotation/interface';
    import type { SideBarOption } from '../interface';
    import type { MCPConfigureOption } from '../mcp-configure/interface';
    import type { CodeItemData } from '../widget/interface';

    export interface BindHostStore {
        kind: 'container' | 'sidebar' | 'annotation' | 'mcp' | 'codes';
        visible?: boolean;
        activeKey?: string;
        annotationKey?: string | string[];
        codes?: CodeItemData[];
        codeKey?: string | string[];
        options?: MCPConfigureOption[];
        customOptions?: MCPConfigureOption[];
        sidebarOptions?: SideBarOption[];
        info?: AnnotationInfo[];
        log: string[];
    }
</script>

<script lang="ts">
    import { Annotation, MCPConfigure, Sidebar } from '../index';

    let { store }: { store: BindHostStore } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if store.kind === 'container'}
    <Sidebar.Container bind:visible={store.visible} onCancel={() => log('cancel')} title="容器">
        <p>内容</p>
    </Sidebar.Container>
{:else if store.kind === 'sidebar'}
    <Sidebar bind:activeKey={store.activeKey} bind:visible={store.visible} onActiveOptionChange={(_event, key) => log(`active ${key}`)} options={store.sidebarOptions} title="侧栏" />
{:else if store.kind === 'annotation'}
    <Annotation bind:activeKey={store.annotationKey} bind:visible={store.visible} info={store.info} />
{:else if store.kind === 'codes'}
    <Sidebar.CodeContent bind:activeKey={store.codeKey} codes={store.codes} onChange={(key) => log(`change ${key}`)} onExpand={() => log('expand')} />
{:else}
    <MCPConfigure bind:customOptions={store.customOptions} bind:options={store.options} bind:visible={store.visible} onStatusChange={(_list, custom) => log(`status ${custom}`)} />
{/if}
