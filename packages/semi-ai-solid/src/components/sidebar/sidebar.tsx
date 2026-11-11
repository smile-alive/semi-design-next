import { Match, Show, Switch, children, createEffect, createMemo, on, onCleanup, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
import { focusAfterModeChange } from '@fibrae/semi-ai-foundation/components/sidebar/utils';
import { copyText } from '@fibrae/semi-foundation/utils';
import { IconClose, IconCopyStroked } from '@fibrae/semi-icons-solid';
import { useDefaultProps } from '@fibrae/semi-ui-solid/base';
import Button from '@fibrae/semi-ui-solid/button/index';
import { useLocale } from '@fibrae/semi-ui-solid/primitives';
import { ToastFactory } from '@fibrae/semi-ui-solid/toast/index';
import { hasContent } from '@fibrae/semi-ui-solid/utils';
import CodeContent, { CodeItem } from './code';
import Container from './container';
import FileContent, { FileItem } from './file';
import type { SideBarProps } from './interface';
import Options from './options';

const prefixCls = cssClasses.SIDEBAR;

const defaultProps = {
    mode: strings.MODE.MAIN,
    fileEditable: true,
} satisfies Partial<SideBarProps>;

function Sidebar(rawProps: SideBarProps) {
    const props = useDefaultProps('Sidebar', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'mode',
        'title',
        'class',
        'detailContent',
        'activeKey',
        'options',
        'onActiveOptionChange',
        'renderOptionIcon',
        'renderOptionItem',
        'renderMainContent',
        'renderDetailHeader',
        'renderDetailContent',
        'fileEditable',
        'onFileContentChange',
        'onBackWard',
        'onDetailContentCopy',
        'imgUploadProps',
        'afterVisibleChange',
        'children',
        // declared via ContainerSolidProps but unused by Sidebar; kept out of rest
        'containerRef',
        'renderHeader',
    ]);

    const locale = useLocale('Sidebar');

    let root: HTMLDivElement | undefined;

    const toast = ToastFactory.create({ getPopupContainer: () => root! });
    const mode = createMemo(() => local.mode);

    // another item, or the same key in another mode, remounts the detail and with it the editor
    const detailKey = createMemo(() => `${mode()}:${local.detailContent?.key ?? ''}`);

    const isMain = () => mode() === strings.MODE.MAIN;

    const handleAfterVisibleChange = (isVisible: boolean) => {
        if (!isVisible) {
            toast.destroyAll();
        }
        local.afterVisibleChange?.(isVisible);
    };

    const handleCopyDetailContent = (e: MouseEvent) => {
        const content = local.detailContent?.content as string;
        void copyText(content).then((res) => {
            // hidden while the clipboard write was pending
            if (res && root?.isConnected) {
                toast.success({ content: locale().locale.copySuccess });
            }
            local.onDetailContentCopy?.(e, content, res);
        });
    };

    // Resolved where the header is inserted: a hidden Container never calls detailHeader, so the render prop is not run
    const detailHeader = () => {
        const customHeader = children(() => local.renderDetailHeader?.(mode(), local.detailContent));
        return (
            <Show
                when={hasContent(customHeader())}
                fallback={
                    <div class={`${prefixCls}-detail-header`}>
                        <span class={cssClasses.DETAIL_HEADER_LEFT}>
                            <Button type="tertiary" aria-label={locale().locale.close} theme="borderless" icon={<IconClose />} onClick={(e) => local.onBackWard?.(e, strings.MODE.MAIN)} />
                            <span class={`${prefixCls}-detail-header-title`}>{local.detailContent?.name}</span>
                        </span>
                        <span class={`${prefixCls}-detail-header-right`}>
                            <Show when={typeof local.detailContent?.content === 'string'}>
                                <Button type="tertiary" aria-label={locale().locale.copy} theme="borderless" icon={<IconCopyStroked />} onClick={handleCopyDetailContent} />
                            </Show>
                        </span>
                    </div>
                }
            >
                {customHeader()}
            </Show>
        );
    };

    const detail = () => {
        const customDetail = children(() => local.renderDetailContent?.(mode()));
        return (
            <Show
                when={hasContent(customDetail())}
                fallback={
                    <Show when={detailKey()} keyed>
                        <Switch>
                            <Match when={mode() === strings.MODE.CODE}>
                                <CodeItem {...local.detailContent!} />
                            </Match>
                            <Match when={mode() === strings.MODE.FILE}>
                                <FileItem {...local.detailContent!} editable={local.fileEditable ?? true} imgUploadProps={local.imgUploadProps} onContentChange={local.onFileContentChange} />
                            </Match>
                        </Switch>
                    </Show>
                }
            >
                {customDetail()}
            </Show>
        );
    };

    // Deferred rather than useWatch: the new view renders after the first effect run, so a mode set before it would
    // query the old view, and no pressed button has gone missing yet
    createEffect(on(mode, (next) => focusAfterModeChange(root, next === strings.MODE.MAIN), { defer: true }));

    // The container element is replaced on each hide and show; a toast list left behind would stay in the detached one.
    onCleanup(() => toast.destroyAll());

    return (
        <Container {...rest} class={clsx(local.class, { [`${prefixCls}-main`]: isMain(), [`${prefixCls}-detail`]: !isMain() })} title={isMain() ? local.title : null} afterVisibleChange={handleAfterVisibleChange} containerRef={(node) => (root = node)} renderHeader={isMain() ? undefined : detailHeader}>
            <Show when={isMain()} fallback={detail()}>
                <div class={`${prefixCls}-main-content-wrapper`}>
                    <Options activeKey={local.activeKey} options={local.options} renderOptionIcon={local.renderOptionIcon} renderOptionItem={local.renderOptionItem} onChange={local.onActiveOptionChange} />
                    <div class={`${prefixCls}-main-content`}>{local.renderMainContent?.(local.activeKey!)}</div>
                </div>
            </Show>
        </Container>
    );
}

export default Object.assign(Sidebar, {
    FileContent,
    CodeContent,
    FileItem,
    CodeItem,
    Container,
});
