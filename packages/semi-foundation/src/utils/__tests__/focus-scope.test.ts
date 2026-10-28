import { afterEach, describe, expect, it } from 'vite-plus/test';
import FocusScope from '../focus-scope';

function setup() {
    document.body.innerHTML = `
        <button data-popupid="outer">trigger</button>
        <div popover id="outer">
            <button data-popupid="inner">submenu</button>
        </div>
        <div popover id="inner">
            <button>item</button>
        </div>
        <div id="dialog" tabindex="-1"><button>ok</button></div>
    `;
    const get = (selector: string) => document.querySelector<HTMLElement>(selector);
    get('#outer').showPopover();
    get('#inner').showPopover();
    return { trigger: get('[data-popupid="outer"]'), submenu: get('[data-popupid="inner"]'), item: get('#inner button'), dialog: get('#dialog') };
}

describe('FocusScope', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('记录的元素仍在文档中时归还给它', () => {
        const { item, dialog } = setup();
        const scope = new FocusScope();
        item.focus();
        scope.record();
        scope.activate(dialog);
        scope.deactivate();
        scope.restore();
        expect(document.activeElement).toBe(item);
    });

    it('记录的元素所在弹层已卸载时，焦点交还打开该弹层的触发器', () => {
        const { item, dialog } = setup();
        const scope = new FocusScope();
        item.focus();
        scope.record();
        scope.activate(dialog);
        document.getElementById('inner').remove();
        scope.deactivate();
        scope.restore();
        expect(document.activeElement?.textContent).toBe('submenu');
    });

    it('整条弹层链都已卸载时，焦点交还最外层弹层的触发器', () => {
        const { item, trigger, dialog } = setup();
        const scope = new FocusScope();
        item.focus();
        scope.record();
        scope.activate(dialog);
        document.getElementById('inner').remove();
        document.getElementById('outer').remove();
        scope.deactivate();
        scope.restore();
        expect(document.activeElement).toBe(trigger);
    });

    it('记录的焦点在弹层内的 shadow root 里时，弹层卸载后焦点交还打开该弹层的触发器', () => {
        const { submenu, dialog } = setup();
        const host = document.createElement('div');
        document.getElementById('inner').append(host);
        const input = document.createElement('input');
        host.attachShadow({ mode: 'open' }).append(input);
        const scope = new FocusScope();
        input.focus();
        scope.record();
        scope.activate(dialog);
        document.getElementById('inner').remove();
        scope.deactivate();
        scope.restore();
        expect(document.activeElement).toBe(submenu);
    });

    it('跳过已禁用的触发器', () => {
        const { item, trigger, submenu, dialog } = setup();
        const scope = new FocusScope();
        item.focus();
        scope.record();
        scope.activate(dialog);
        document.getElementById('inner').remove();
        submenu.setAttribute('disabled', '');
        scope.deactivate();
        scope.restore();
        expect(document.activeElement).toBe(trigger);
    });

    it('engage 在模态时困住 Tab，非模态时只聚焦容器', () => {
        const { dialog } = setup();
        const tabFromDialog = () => {
            const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
            dialog.dispatchEvent(event);
            return event.defaultPrevented;
        };
        const scope = new FocusScope();
        scope.engage(dialog, false);
        expect(document.activeElement).toBe(dialog);
        expect(tabFromDialog()).toBe(false);
        scope.engage(dialog, true);
        expect(tabFromDialog()).toBe(true);
        scope.deactivate();
    });

    it('restoreIfAllowed 在非模态且焦点已移出容器时不归还', () => {
        const { trigger, item, dialog } = setup();
        const scope = new FocusScope();
        trigger.focus();
        scope.record();
        scope.enter(dialog);
        item.focus();
        scope.restoreIfAllowed(dialog, false);
        expect(document.activeElement).toBe(item);
        scope.restoreIfAllowed(dialog, true);
        expect(document.activeElement).toBe(trigger);
    });
});
