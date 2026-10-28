import type React from 'react';
import { createRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
import { focusAfterModeChange } from '@fibrae/semi-ai-foundation/sidebar/utils';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
import { IconClose, IconCopyStroked } from '@fibrae/semi-icons-react';
import useDefaultProps from '@fibrae/semi-ui-react/_base/use-default-props';
import Button from '@fibrae/semi-ui-react/button/index';
import { useDidUpdate, useLocale } from '@fibrae/semi-ui-react/hooks';
import { ToastFactory } from '@fibrae/semi-ui-react/toast/index';
import Container from './container';
import type { SideBarProps } from './interface';
import Options from './options';
import CodeContent, { CodeItem } from './widget/code';
import FileContent, { FileItem } from './widget/file';

const prefixCls = cssClasses.SIDEBAR;

const defaultProps = {
    mode: strings.MODE.MAIN,
    fileEditable: true,
} satisfies Partial<SideBarProps>;

class SidebarRuntime {
    readonly containerRef = createRef<HTMLDivElement>();
    readonly toast = ToastFactory.create({ getPopupContainer: () => this.containerRef.current });
}

function Sidebar(rawProps: SideBarProps) {
    const props = useDefaultProps('Sidebar', rawProps, defaultProps);

    const {
        mode,
        title,
        className,
        detailContent,
        activeKey,
        options,
        onActiveOptionChange,
        renderOptionItem,
        renderMainContent,
        renderDetailHeader,
        renderDetailContent,
        fileEditable,
        onFileContentChange,
        onBackWard,
        onDetailContentCopy,
        imgUploadProps,
        afterVisibleChange,
        // declared via ContainerReactProps but unused by Sidebar; kept out of rest
        containerRef,
        renderHeader,
        ...rest
    } = props;

    const { locale } = useLocale('Sidebar');

    const [runtime] = useState(() => new SidebarRuntime());

    const isMain = mode === strings.MODE.MAIN;

    const handleAfterVisibleChange = (isVisible: boolean) => {
        if (!isVisible) {
            runtime.toast.destroyAll();
        }
        afterVisibleChange?.(isVisible);
    };

    const handleCopyDetailContent = (e: React.MouseEvent) => {
        const content = detailContent?.content;
        void copyText(content).then((res) => {
            // hidden while the clipboard write was pending
            if (res && runtime.containerRef.current) {
                runtime.toast.success({ content: locale.copySuccess });
            }
            onDetailContentCopy?.(e, content, res);
        });
    };

    const renderDetailHeaderNode = () =>
        renderDetailHeader?.(mode, detailContent) || (
            <div className={`${prefixCls}-detail-header`}>
                <span className={`${prefixCls}-detail-header-left`}>
                    <Button type="tertiary" aria-label={locale.close} theme="borderless" icon={<IconClose />} onClick={(e) => onBackWard?.(e, strings.MODE.MAIN)} />
                    <span className={`${prefixCls}-detail-header-title`}>{detailContent?.name}</span>
                </span>
                <span className={`${prefixCls}-detail-header-right`}>{typeof detailContent?.content === 'string' && <Button type="tertiary" aria-label={locale.copy} theme="borderless" icon={<IconCopyStroked />} onClick={handleCopyDetailContent} />}</span>
            </div>
        );

    const renderDetail = () => {
        const result = renderDetailContent?.(mode);
        if (result) {
            return result;
        }
        // the key stays the element key, so another item remounts the editor
        const { key, ...item } = detailContent ?? {};
        if (mode === strings.MODE.CODE) {
            return <CodeItem key={key} {...item} />;
        }
        if (mode === strings.MODE.FILE) {
            return <FileItem key={key} {...item} editable={fileEditable ?? true} imgUploadProps={imgUploadProps} onContentChange={onFileContentChange} />;
        }
        return null;
    };

    useDidUpdate(mode, (next) => focusAfterModeChange(runtime.containerRef.current, next === strings.MODE.MAIN));

    // The container element is replaced on each hide and show; a toast list left behind would stay in the detached one.
    useEffect(() => () => runtime.toast.destroyAll(), [runtime]);

    return (
        <Container
            {...rest}
            className={clsx(className, {
                [`${prefixCls}-main`]: isMain,
                [`${prefixCls}-detail`]: !isMain,
            })}
            title={isMain ? title : null}
            afterVisibleChange={handleAfterVisibleChange}
            containerRef={runtime.containerRef}
            renderHeader={isMain ? undefined : renderDetailHeaderNode}
        >
            {isMain ? (
                <div className={`${prefixCls}-main-content-wrapper`}>
                    <Options activeKey={activeKey} options={options} renderOptionItem={renderOptionItem} onChange={onActiveOptionChange} />
                    <div className={`${prefixCls}-main-content`}>{renderMainContent?.(activeKey)}</div>
                </div>
            ) : (
                renderDetail()
            )}
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
