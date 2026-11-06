import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import ModalResources from '../modal-resources';

function setup() {
    document.body.innerHTML = `
        <button id="opener">open</button>
        <div id="page"><button id="other">other</button></div>
        <div id="overlay"><div id="dialog" tabindex="-1"><button id="inside">ok</button></div></div>
    `;
    const get = (id: string) => document.getElementById(id);
    return { opener: get('opener'), page: get('page'), other: get('other'), overlay: get('overlay'), dialog: get('dialog') };
}

function pressEsc() {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
}

describe('ModalResources', () => {
    const resources: ModalResources[] = [];
    const create = () => {
        const instance = new ModalResources();
        resources.push(instance);
        return instance;
    };

    afterEach(() => {
        for (const instance of resources.splice(0)) {
            instance.release();
        }
        document.body.innerHTML = '';
    });

    it('模态时锁定滚动、使页面 inert、移入焦点，释放后全部归还并把焦点还给打开者', () => {
        const { opener, page, overlay, dialog } = setup();
        const modal = create();
        opener.focus();
        modal.record();
        modal.hold({ modal: true, layer: overlay, focus: dialog });

        expect(document.body.style.overflow).toBe('hidden');
        expect(page.inert).toBe(true);
        expect(overlay.inert).toBeFalsy();
        expect(dialog.contains(document.activeElement)).toBe(true);

        modal.release();
        expect(document.body.style.overflow).toBe('');
        expect(page.inert).toBeFalsy();
        expect(document.activeElement).toBe(opener);
    });

    it('非模态时不锁滚动、不 inert；用户把焦点移到页面上后释放不抢回焦点', () => {
        const { opener, page, other, overlay, dialog } = setup();
        const sheet = create();
        opener.focus();
        sheet.record();
        sheet.hold({ modal: false, layer: overlay, focus: dialog });

        expect(document.body.style.overflow).toBe('');
        expect(page.inert).toBeFalsy();

        other.focus();
        sheet.release();
        expect(document.activeElement).toBe(other);
    });

    it('lockScroll 单独决定滚动锁；没有 focus 的持有释放时不移动焦点', () => {
        const { other } = setup();
        const guide = create();
        guide.hold({ modal: false, lockScroll: true });
        expect(document.body.style.overflow).toBe('hidden');

        document.body.focus();
        guide.record();
        other.focus();
        other.blur();
        guide.release();
        expect(document.body.style.overflow).toBe('');
        expect(document.activeElement).toBe(document.body);
    });

    it('再次持有替换上一次的持有，释放可重复调用', () => {
        const { overlay } = setup();
        const sheet = create();
        sheet.hold({ modal: true, layer: overlay });
        sheet.hold({ modal: true, layer: overlay, lockScroll: false });
        expect(document.body.style.overflow).toBe('');

        sheet.release();
        sheet.release();
        expect(document.body.style.overflow).toBe('');
    });

    it('位于栈顶时 Escape 交给 onEscape，释放后不再接收', () => {
        const { overlay } = setup();
        const onEscape = vi.fn<() => boolean>(() => true);
        const sheet = create();
        sheet.hold({ modal: false, layer: overlay, onEscape });
        pressEsc();
        expect(onEscape).toHaveBeenCalledTimes(1);

        sheet.release();
        pressEsc();
        expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('释放后再次归还焦点，用于框架在关闭后又聚焦了别的元素', () => {
        const { opener, overlay, dialog, other } = setup();
        const modal = create();
        opener.focus();
        modal.record();
        modal.hold({ modal: true, layer: overlay, focus: dialog });
        modal.release();

        other.focus();
        modal.restoreFocus();
        expect(document.activeElement).toBe(opener);
    });
});
