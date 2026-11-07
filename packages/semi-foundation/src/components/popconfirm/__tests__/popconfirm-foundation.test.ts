import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import PopconfirmFoundation, { type PopconfirmAdapter, type PopconfirmBaseProps } from '../popconfirm-foundation';

function setup(props: PopconfirmBaseProps) {
    let footer: HTMLElement | null = null;
    const setInitialFocus = vi.fn<PopconfirmAdapter['setInitialFocus']>();
    const adapter = {
        getProps: () => props,
        getFooter: () => footer,
        setInitialFocus,
        setState: () => {},
        focusPrevFocusElement: () => {},
    } as unknown as PopconfirmAdapter;
    const foundation = new PopconfirmFoundation(adapter);
    const mountFooter = () => {
        footer = document.createElement('div');
        footer.innerHTML = '<button data-type="cancel"></button><button data-type="ok"></button>';
        document.body.append(footer);
        return footer;
    };
    return { foundation, setInitialFocus, mountFooter };
}

describe('PopconfirmFoundation 的 autoFocus 按钮', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('打开时 footer 尚未挂载，等 handleFooterMounted 再聚焦并交给 Tooltip', () => {
        const { foundation, setInitialFocus, mountFooter } = setup({ okButtonProps: { autoFocus: true } });
        foundation.handlePopupOpen();
        expect(setInitialFocus).not.toHaveBeenCalled();
        const ok = mountFooter().querySelector<HTMLElement>('[data-type=ok]');
        foundation.handleFooterMounted();
        expect(document.activeElement).toBe(ok);
        expect(setInitialFocus).toHaveBeenCalledWith(ok);
        foundation.handleFooterMounted();
        expect(setInitialFocus).toHaveBeenCalledTimes(1);
    });

    it('取消按钮优先，禁用的按钮不聚焦，关闭后不再聚焦', () => {
        const first = setup({ cancelButtonProps: { autoFocus: true }, okButtonProps: { autoFocus: true } });
        const cancel = first.mountFooter().querySelector<HTMLElement>('[data-type=cancel]');
        first.foundation.handlePopupOpen();
        expect(document.activeElement).toBe(cancel);

        const disabled = setup({ okButtonProps: { autoFocus: true, disabled: true } });
        disabled.foundation.handlePopupOpen();
        disabled.mountFooter();
        disabled.foundation.handleFooterMounted();
        expect(disabled.setInitialFocus).not.toHaveBeenCalled();

        const closed = setup({ okButtonProps: { autoFocus: true } });
        closed.foundation.handlePopupOpen();
        closed.foundation.handlePopupClose();
        closed.mountFooter();
        closed.foundation.handleFooterMounted();
        expect(closed.setInitialFocus).not.toHaveBeenCalled();
    });
});
