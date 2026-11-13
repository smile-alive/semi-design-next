import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { type CheckOptions, checkPattern, type Pattern } from '../index';

const user = userEvent.setup();
const press = (key: string) => user.keyboard(key === 'Shift+Tab' ? '{Shift>}{Tab}{/Shift}' : key.length === 1 ? key : `{${key}}`);
const expectPattern = (pattern: Pattern, root: Element, options: Partial<CheckOptions> = {}) => checkPattern(pattern, root, { press, ...options });

function mount(html: string) {
    document.body.innerHTML = html;
    return document.body.firstElementChild as HTMLElement;
}

const all = (root: Element, selector: string) => [...root.querySelectorAll<HTMLElement>(selector)];

afterEach(() => {
    document.body.innerHTML = '';
});

interface RovingKeys {
    next: string[];
    prev: string[];
    wrap?: boolean;
    homeEnd?: boolean;
}

// Roving tabindex: one item has tabindex 0, the keys move it and focus, disabled items are skipped
function roving(items: HTMLElement[], { next, prev, wrap = true, homeEnd = true }: RovingKeys, onMove?: (item: HTMLElement) => void) {
    const go = (from: number, step: number) => {
        let index = from;
        for (let tries = 0; tries < items.length; tries++) {
            index += step;
            if (index < 0 || index >= items.length) {
                if (!wrap) {
                    return from;
                }
                index = (index + items.length) % items.length;
            }
            if (items[index].getAttribute('aria-disabled') !== 'true') {
                return index;
            }
        }
        return from;
    };
    for (const item of items) {
        item.addEventListener('keydown', (event) => {
            const from = items.indexOf(item);
            let to = -1;
            if (next.includes(event.key)) {
                to = go(from, 1);
            } else if (prev.includes(event.key)) {
                to = go(from, -1);
            } else if (homeEnd && event.key === 'Home') {
                to = 0;
            } else if (homeEnd && event.key === 'End') {
                to = items.length - 1;
            }
            if (to < 0) {
                return;
            }
            event.preventDefault();
            items.forEach((el, index) => {
                el.tabIndex = index === to ? 0 : -1;
            });
            items[to].focus();
            onMove?.(items[to]);
        });
    }
}

// aria-activedescendant: the container keeps focus, the keys move the id it names
function activeDescendant(container: HTMLElement, items: HTMLElement[], { next = 'ArrowDown', prev = 'ArrowUp', homeEnd = true } = {}) {
    container.addEventListener('keydown', (event) => {
        const from = items.findIndex((item) => item.id === container.getAttribute('aria-activedescendant'));
        let to = -1;
        if (event.key === next) {
            to = Math.min(from + 1, items.length - 1);
        } else if (event.key === prev) {
            to = Math.max(from - 1, 0);
        } else if (homeEnd && event.key === 'Home') {
            to = 0;
        } else if (homeEnd && event.key === 'End') {
            to = items.length - 1;
        }
        if (to < 0) {
            return;
        }
        event.preventDefault();
        container.setAttribute('aria-activedescendant', items[to].id);
    });
}

function tabsFixture({ automatic = true, keys = ['ArrowRight', 'ArrowLeft'], wrap = true, homeEnd = true, orientation = '' } = {}) {
    const root = mount(`<div>
        <div role="tablist" aria-label="设置" ${orientation && `aria-orientation="${orientation}"`}>
            <div role="tab" id="t1" aria-selected="true" aria-controls="p1" tabindex="0">常规</div>
            <div role="tab" id="t2" aria-selected="false" aria-controls="p2" tabindex="-1">账号</div>
            <div role="tab" id="t3" aria-selected="false" aria-controls="p3" tabindex="-1">隐私</div>
        </div>
        <div role="tabpanel" id="p1" aria-labelledby="t1">一</div>
        <div role="tabpanel" id="p2" aria-labelledby="t2" hidden>二</div>
        <div role="tabpanel" id="p3" aria-labelledby="t3" hidden>三</div>
    </div>`);
    const tabs = all(root, '[role=tab]');
    const panels = all(root, '[role=tabpanel]');
    const select = (tab: HTMLElement) => {
        tabs.forEach((el) => el.setAttribute('aria-selected', String(el === tab)));
        panels.forEach((panel) => {
            panel.hidden = panel.id !== tab.getAttribute('aria-controls');
        });
    };
    roving(tabs, { next: [keys[0]], prev: [keys[1]], wrap, homeEnd }, automatic ? select : undefined);
    if (!automatic) {
        for (const tab of tabs) {
            tab.addEventListener('keydown', (event) => (event.key === 'Enter' || event.key === ' ') && select(tab));
        }
    }
    return { root, tabs, panels };
}

describe('tabs', () => {
    it('自动激活与手动激活的正确实现都通过', async () => {
        await expectPattern('tabs', tabsFixture().root);
        await expectPattern('tabs', tabsFixture({ automatic: false }).root);
    });

    it('垂直 tabs 用上下方向键，RTL 下水平方向翻转', async () => {
        await expectPattern('tabs', tabsFixture({ keys: ['ArrowDown', 'ArrowUp'], orientation: 'vertical' }).root);
        await expectPattern('tabs', tabsFixture({ keys: ['ArrowLeft', 'ArrowRight'] }).root, { direction: 'rtl' });
        await expect(expectPattern('tabs', tabsFixture({ keys: ['ArrowDown', 'ArrowUp'] }).root)).rejects.toThrow(/按 ArrowRight 应移到下一个tab/);
    });

    it('缺少 aria-selected 时点名该 tab', async () => {
        const { root, tabs } = tabsFixture();
        tabs[1].removeAttribute('aria-selected');
        await expect(expectPattern('tabs', root)).rejects.toThrow(/tab "账号" #t2: aria-selected 应为 "true" 或 "false"，实际为 缺失/);
    });

    it('方向键不起作用时报告焦点没有移动', async () => {
        const { root } = tabsFixture({ keys: ['ArrowDown', 'ArrowUp'] });
        await expect(expectPattern('tabs', root)).rejects.toThrow(/按 ArrowRight 应移到下一个tab.*焦点没有移动/);
    });

    it('Tab 停靠点多一个时报告', async () => {
        const { root, tabs } = tabsFixture();
        tabs[1].tabIndex = 0;
        await expect(expectPattern('tabs', root)).rejects.toThrow(/有 2 个 Tab 停靠点/);
    });

    it('aria-controls 指向不存在的 id 时报告', async () => {
        const { root, tabs } = tabsFixture();
        tabs[0].setAttribute('aria-controls', 'ghost');
        await expect(expectPattern('tabs', root)).rejects.toThrow(/aria-controls 指向的 id "ghost" 不在页面中/);
    });

    it('多个问题一次抛出', async () => {
        const { root, tabs } = tabsFixture();
        tabs[1].removeAttribute('aria-selected');
        tabs[2].tabIndex = 0;
        const message = await expectPattern('tabs', root).catch((error: Error) => error.message);
        expect(message).toMatch(/aria-selected/);
        expect(message).toMatch(/Tab 停靠点/);
    });

    it('不循环时按 APG 判违规，wraps 选项可放宽', async () => {
        await expect(expectPattern('tabs', tabsFixture({ wrap: false }).root)).rejects.toThrow(/循环/);
        await expectPattern('tabs', tabsFixture({ wrap: false }).root, { wraps: 'optional' });
    });

    it('Home 与 End 是可选的：不支持时通过，要求时报告，支持但跳错时报告', async () => {
        await expectPattern('tabs', tabsFixture({ homeEnd: false }).root);
        await expect(expectPattern('tabs', tabsFixture({ homeEnd: false }).root, { homeEnd: true })).rejects.toThrow(/按 End 应移到最后一个tab/);
        const { root, tabs } = tabsFixture();
        root.addEventListener(
            'keydown',
            (event) => {
                if (event.key === 'End') {
                    event.stopPropagation();
                    tabs[1].focus();
                }
            },
            true
        );
        await expect(expectPattern('tabs', root)).rejects.toThrow(/按 End/);
    });

    it('手动激活的 tab 按 Enter 不选中时报告，actions: false 时不按', async () => {
        const broken = () => {
            const { root } = tabsFixture({ automatic: false });
            root.addEventListener('keydown', (event) => (event.key === 'Enter' || event.key === ' ') && event.stopPropagation(), true);
            return root;
        };
        await expect(expectPattern('tabs', broken())).rejects.toThrow(/按 Enter 应激活/);
        await expectPattern('tabs', broken(), { actions: false });
    });

    it('找不到 tablist 时报告', async () => {
        await expect(expectPattern('tabs', mount('<div></div>'))).rejects.toThrow(/内部没有 role=tablist/);
    });
});

function listboxFixture({ homeEnd = true } = {}) {
    const root = mount(`<div id="lb" role="listbox" aria-label="水果" tabindex="0">
        <div role="option" id="o1" aria-selected="false">Apple</div>
        <div role="option" id="o2" aria-selected="false" aria-disabled="true">Banana</div>
        <div role="option" id="o3" aria-selected="false">Cherry</div>
    </div>`);
    const options = all(root, '[role=option]');
    activeDescendant(root, options, { homeEnd });
    root.addEventListener('keydown', (event) => {
        const current = options.find((option) => option.id === root.getAttribute('aria-activedescendant'));
        if (event.key === ' ' && current) {
            current.setAttribute('aria-selected', 'true');
        }
    });
    return { root, options };
}

describe('listbox', () => {
    it('aria-activedescendant 模型的正确实现通过，禁用项被跳过', async () => {
        await expectPattern('listbox', listboxFixture().root);
    });

    it('选项没有 aria-selected 时点名', async () => {
        const { root, options } = listboxFixture();
        options[2].removeAttribute('aria-selected');
        await expect(expectPattern('listbox', root)).rejects.toThrow(/option "Cherry" #o3: 没有 aria-selected/);
    });

    it('aria-activedescendant 指向不存在的元素时报告', async () => {
        const { root } = listboxFixture();
        root.setAttribute('aria-activedescendant', 'ghost');
        await expect(expectPattern('listbox', root)).rejects.toThrow(/aria-activedescendant 指向的 id "ghost"/);
    });

    it('选项自己带 tabindex 成为停靠点时，与容器的 aria-activedescendant 冲突', async () => {
        const { root, options } = listboxFixture();
        root.setAttribute('aria-activedescendant', 'o1');
        options[0].tabIndex = 0;
        await expect(expectPattern('listbox', root)).rejects.toThrow(/有 2 个 Tab 停靠点/);
    });

    it('Space 不选中时报告', async () => {
        const { root } = listboxFixture();
        root.addEventListener('keydown', (event) => event.key === ' ' && event.stopImmediatePropagation(), true);
        await expect(expectPattern('listbox', root)).rejects.toThrow(/按 Space 应选中/);
    });

    it('typeahead 默认不查，开启后查', async () => {
        await expectPattern('listbox', listboxFixture().root);
        await expect(expectPattern('listbox', listboxFixture().root, { typeahead: true })).rejects.toThrow(/type-ahead/);
    });
});

function comboboxFixture({ closeOnEscape = true } = {}) {
    const root = mount(`<div>
        <input role="combobox" id="cb" aria-label="城市" aria-expanded="false" aria-controls="cb-list" aria-autocomplete="list" />
        <ul role="listbox" id="cb-list" aria-label="城市" hidden>
            <li role="option" id="c1" aria-selected="false">北京</li>
            <li role="option" id="c2" aria-selected="false">上海</li>
        </ul>
    </div>`);
    const input = root.querySelector<HTMLInputElement>('input')!;
    const list = root.querySelector<HTMLElement>('ul')!;
    const options = all(root, 'li');
    input.addEventListener('keydown', (event) => {
        const at = options.findIndex((option) => option.id === input.getAttribute('aria-activedescendant'));
        if (event.key === 'ArrowDown' && input.getAttribute('aria-expanded') === 'false') {
            input.setAttribute('aria-expanded', 'true');
            list.hidden = false;
        } else if (event.key === 'ArrowDown') {
            input.setAttribute('aria-activedescendant', options[Math.min(at + 1, options.length - 1)].id);
        } else if (event.key === 'ArrowUp') {
            input.setAttribute('aria-activedescendant', options[Math.max(at - 1, 0)].id);
        } else if (event.key === 'Escape' && closeOnEscape) {
            input.setAttribute('aria-expanded', 'false');
            list.hidden = true;
        }
    });
    return { root, input, options };
}

describe('combobox', () => {
    it('输入框保持焦点、选项靠 aria-activedescendant 移动的实现通过', async () => {
        await expectPattern('combobox', comboboxFixture().root);
    });

    it('Escape 不关闭弹层时报告，actions: false 时不按', async () => {
        await expect(expectPattern('combobox', comboboxFixture({ closeOnEscape: false }).root)).rejects.toThrow(/按 Escape 应关闭弹层/);
        await expectPattern('combobox', comboboxFixture({ closeOnEscape: false }).root, { actions: false });
    });

    it('选项抢走 DOM 焦点时报告', async () => {
        const { root, input, options } = comboboxFixture();
        options.forEach((option) => {
            option.tabIndex = -1;
        });
        input.addEventListener('keydown', (event) => event.key === 'ArrowDown' && input.getAttribute('aria-expanded') === 'true' && options[0].focus());
        await expect(expectPattern('combobox', root)).rejects.toThrow(/焦点移到了 li|DOM 焦点移到了/);
    });

    it('Escape 后输入框卸载、焦点交给收起的同角色 combobox 时通过，交给其他元素时报告', async () => {
        const handOver = (successor: string) => {
            const { input } = comboboxFixture();
            document.body.insertAdjacentHTML('beforeend', successor);
            const next = document.body.lastElementChild as HTMLElement;
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    input.remove();
                    next.focus();
                }
            });
            return input;
        };
        const owner = '<div role="combobox" tabindex="0" aria-label="城市" aria-expanded="false"></div>';
        const input = handOver(owner);
        document.body.prepend(input.parentElement!);
        await expectPattern('combobox', input.parentElement!);
        document.body.innerHTML = '';
        const other = handOver('<button>其他</button>');
        document.body.prepend(other.parentElement!);
        await expect(expectPattern('combobox', other.parentElement!)).rejects.toThrow(/弹层被 Escape 关闭后焦点应留在它上面/);
    });

    it('弹出 tree 时要求 aria-haspopup="tree"，并按 treeitem 检查当前项移动', async () => {
        const treeFixture = (haspopup: boolean) => {
            const { root, input } = comboboxFixture();
            const list = root.querySelector('ul')!;
            list.setAttribute('role', 'tree');
            list.querySelectorAll('li').forEach((li) => li.setAttribute('role', 'treeitem'));
            if (haspopup) {
                input.setAttribute('aria-haspopup', 'tree');
            }
            return root;
        };
        await expectPattern('combobox', treeFixture(true));
        await expect(expectPattern('combobox', treeFixture(false))).rejects.toThrow(/应设置 aria-haspopup="tree"/);
    });

    it('缺少 aria-expanded 时点名', async () => {
        const { root, input } = comboboxFixture();
        input.removeAttribute('aria-expanded');
        await expect(expectPattern('combobox', root)).rejects.toThrow(/combobox "城市" #cb: aria-expanded 应为/);
    });
});

function menuFixture({ restoreFocus = true } = {}) {
    const root = mount(`<div>
        <button id="mb" aria-haspopup="menu" aria-expanded="true" aria-controls="m1">操作</button>
        <ul role="menu" id="m1" aria-labelledby="mb">
            <li role="menuitem" tabindex="-1">复制</li>
            <li role="menuitem" tabindex="-1" aria-disabled="true">粘贴</li>
            <li role="menuitemcheckbox" tabindex="-1" aria-checked="false">自动保存</li>
            <li role="menuitem" tabindex="-1">删除</li>
        </ul>
    </div>`);
    const trigger = root.querySelector<HTMLElement>('#mb')!;
    const menu = root.querySelector<HTMLElement>('ul')!;
    const items = all(root, 'li');
    roving(items, { next: ['ArrowDown'], prev: ['ArrowUp'] });
    menu.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            menu.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            if (restoreFocus) {
                trigger.focus();
            }
        }
    });
    items[0].focus();
    return { root, trigger, items };
}

describe('menu', () => {
    it('正确实现通过（可选项 Home、End、循环与 typeahead 均不判违规）', async () => {
        await expectPattern('menu', menuFixture().root);
    });

    it('Escape 关闭后焦点没回到按钮时报告', async () => {
        const { root } = menuFixture({ restoreFocus: false });
        await expect(expectPattern('menu', root)).rejects.toThrow(/焦点留在|焦点掉到了 body|焦点应回到它/);
    });

    it('menuitemcheckbox 缺少 aria-checked 时点名', async () => {
        const { root, items } = menuFixture();
        items[2].removeAttribute('aria-checked');
        await expect(expectPattern('menu', root)).rejects.toThrow(/menuitemcheckbox "自动保存": aria-checked 应为/);
    });

    it('触发按钮缺少 aria-haspopup 时报告', async () => {
        const { root, trigger } = menuFixture();
        trigger.removeAttribute('aria-haspopup');
        await expect(expectPattern('menu', root)).rejects.toThrow(/aria-haspopup 应为 "menu" 或 "true"/);
    });

    it('菜单没打开时提示先打开', async () => {
        const { root } = menuFixture();
        root.querySelector<HTMLElement>('ul')!.hidden = true;
        await expect(expectPattern('menu', root)).rejects.toThrow(/没有打开的菜单/);
    });
});

function menubarFixture({ wrap = true } = {}) {
    const root = mount(`<div>
        <ul role="menubar" aria-label="主菜单">
            <li role="menuitem" tabindex="0" aria-haspopup="menu" aria-expanded="false" aria-controls="sub">文件</li>
            <li role="menuitem" tabindex="-1">编辑</li>
            <li role="menuitem" tabindex="-1">帮助</li>
        </ul>
        <ul role="menu" id="sub" aria-label="文件" hidden><li role="menuitem" tabindex="-1">新建</li></ul>
    </div>`);
    const items = all(root, '[role=menubar] > li');
    const sub = root.querySelector<HTMLElement>('#sub')!;
    roving(items, { next: ['ArrowRight'], prev: ['ArrowLeft'], wrap });
    items[0].addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            sub.hidden = false;
            items[0].setAttribute('aria-expanded', 'true');
            sub.querySelector<HTMLElement>('li')!.focus();
        }
    });
    sub.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            sub.hidden = true;
            items[0].setAttribute('aria-expanded', 'false');
            items[0].focus();
        }
    });
    return { root, items };
}

describe('menubar', () => {
    it('循环、向下打开子菜单、Escape 回到菜单项的实现通过', async () => {
        await expectPattern('menubar', menubarFixture().root);
    });

    it('不循环时报告，带子菜单的项缺少 aria-expanded 时点名', async () => {
        await expect(expectPattern('menubar', menubarFixture({ wrap: false }).root)).rejects.toThrow(/循环/);
        const { root, items } = menubarFixture();
        items[0].removeAttribute('aria-expanded');
        await expect(expectPattern('menubar', root)).rejects.toThrow(/menuitem "文件".*aria-expanded 应为/);
    });
});

function radioFixture({ checkOnMove = true } = {}) {
    const root = mount(`<div role="radiogroup" aria-label="尺寸">
        <div role="radio" aria-checked="true" tabindex="0">小</div>
        <div role="radio" aria-checked="false" tabindex="-1">中</div>
        <div role="radio" aria-checked="false" tabindex="-1">大</div>
    </div>`);
    const radios = all(root, '[role=radio]');
    const select = (radio: HTMLElement) => radios.forEach((el) => el.setAttribute('aria-checked', String(el === radio)));
    roving(radios, { next: ['ArrowDown', 'ArrowRight'], prev: ['ArrowUp', 'ArrowLeft'], homeEnd: false }, checkOnMove ? select : undefined);
    radios.forEach((radio) => radio.addEventListener('keydown', (event) => event.key === ' ' && select(radio)));
    return { root, radios };
}

describe('radio-group', () => {
    it('方向键移动并选中的实现通过', async () => {
        await expectPattern('radio-group', radioFixture().root);
    });

    it('移动后没有选中时报告', async () => {
        await expect(expectPattern('radio-group', radioFixture({ checkOnMove: false }).root)).rejects.toThrow(/移到该 radio 后应同时选中它/);
    });

    it('选中的 radio 不是 Tab 停靠点时报告', async () => {
        const { root, radios } = radioFixture();
        radios[0].tabIndex = -1;
        radios[1].tabIndex = 0;
        await expect(expectPattern('radio-group', root)).rejects.toThrow(/应由选中的 radio/);
    });
});

function toolbarFixture({ rtl = false } = {}) {
    const root = mount(`<div role="toolbar" aria-label="格式" ${rtl ? 'dir="rtl"' : ''}>
        <button tabindex="0">粗体</button><button tabindex="-1">斜体</button><button tabindex="-1">下划线</button>
    </div>`);
    const buttons = all(root, 'button');
    roving(buttons, rtl ? { next: ['ArrowLeft'], prev: ['ArrowRight'] } : { next: ['ArrowRight'], prev: ['ArrowLeft'] });
    return { root, buttons };
}

describe('toolbar', () => {
    it('LTR 与 RTL 下按各自方向键移动的实现通过', async () => {
        await expectPattern('toolbar', toolbarFixture().root);
        await expectPattern('toolbar', toolbarFixture({ rtl: true }).root, { direction: 'rtl' });
    });

    it('RTL 下仍按 LTR 方向键实现时报告', async () => {
        await expect(expectPattern('toolbar', toolbarFixture().root, { direction: 'rtl' })).rejects.toThrow(/按 ArrowLeft 应移到下一个控件/);
    });

    it('所有按钮都是 Tab 停靠点时报告', async () => {
        const { root, buttons } = toolbarFixture();
        buttons.forEach((button) => {
            button.tabIndex = 0;
        });
        await expect(expectPattern('toolbar', root)).rejects.toThrow(/有 3 个 Tab 停靠点/);
    });
});

function treeFixture({ expandKeys = true } = {}) {
    const root = mount(`<ul id="tr" role="tree" aria-label="文件" tabindex="0">
        <li role="treeitem" id="a" aria-level="1" aria-expanded="false">src<ul role="group" hidden><li role="treeitem" id="a1" aria-level="2">index.ts</li></ul></li>
        <li role="treeitem" id="b" aria-level="1">README</li>
    </ul>`);
    const a = root.querySelector<HTMLElement>('#a')!;
    const group = root.querySelector<HTMLElement>('ul[role=group]')!;
    const visible = () => all(root, '[role=treeitem]').filter((item) => !item.closest('[hidden]'));
    root.addEventListener('keydown', (event) => {
        const items = visible();
        const at = items.findIndex((item) => item.id === root.getAttribute('aria-activedescendant'));
        const current = items[at];
        const setActive = (item: HTMLElement) => root.setAttribute('aria-activedescendant', item.id);
        if (event.key === 'ArrowDown') {
            setActive(items[Math.min(at + 1, items.length - 1)]);
        } else if (event.key === 'ArrowUp') {
            setActive(items[Math.max(at - 1, 0)]);
        } else if (event.key === 'Home') {
            setActive(items[0]);
        } else if (event.key === 'End') {
            setActive(items.at(-1)!);
        } else if (expandKeys && event.key === 'ArrowRight' && current === a) {
            if (a.getAttribute('aria-expanded') === 'false') {
                a.setAttribute('aria-expanded', 'true');
                group.hidden = false;
            } else {
                setActive(visible()[at + 1]);
            }
        } else if (expandKeys && event.key === 'ArrowLeft') {
            if (current?.id === 'a1') {
                setActive(a);
            } else if (current === a) {
                a.setAttribute('aria-expanded', 'false');
                group.hidden = true;
            }
        } else {
            return;
        }
        event.preventDefault();
    });
    return { root, a };
}

describe('tree', () => {
    it('展开、进入子节点、回到父节点、收起的实现通过', async () => {
        await expectPattern('tree', treeFixture().root);
    });

    it('方向键不展开分支时报告', async () => {
        await expect(expectPattern('tree', treeFixture({ expandKeys: false }).root)).rejects.toThrow(/按 ArrowRight 应展开收起的分支/);
    });

    it('有子分组的节点缺少 aria-expanded 时点名', async () => {
        const { root, a } = treeFixture();
        a.removeAttribute('aria-expanded');
        await expect(expectPattern('tree', root)).rejects.toThrow(/aria-expanded 应为/);
    });
});

function dialogFixture({ trap = true, closeOnEscape = true } = {}) {
    const root = mount(`<div>
        <button id="open" aria-controls="dlg" aria-haspopup="dialog">打开</button>
        <div role="dialog" id="dlg" aria-modal="true" aria-label="确认删除">
            <button id="cancel">取消</button><button id="ok">确定</button>
        </div>
    </div>`);
    const dlg = root.querySelector<HTMLElement>('#dlg')!;
    const buttons = all(dlg, 'button');
    dlg.addEventListener('keydown', (event) => {
        if (event.key === 'Tab' && trap) {
            event.preventDefault();
            const at = buttons.indexOf(document.activeElement as HTMLElement);
            buttons[(at + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
        } else if (event.key === 'Escape' && closeOnEscape) {
            dlg.hidden = true;
            root.querySelector<HTMLElement>('#open')!.focus();
        }
    });
    buttons[0].focus();
    return { root, dlg };
}

describe('dialog', () => {
    it('模态对话框在内部循环 Tab、Escape 关闭并回到触发器的实现通过', async () => {
        await expectPattern('dialog', dialogFixture().root);
    });

    it('Tab 能离开对话框时报告', async () => {
        await expect(expectPattern('dialog', dialogFixture({ trap: false }).root)).rejects.toThrow(/按 Tab 后焦点掉到了 body|焦点要在内部循环/);
    });

    it('Escape 不关闭时报告，缺 aria-modal 时点名', async () => {
        await expect(expectPattern('dialog', dialogFixture({ closeOnEscape: false }).root)).rejects.toThrow(/按 Escape 应关闭对话框/);
        const { root, dlg } = dialogFixture();
        dlg.removeAttribute('aria-modal');
        await expect(expectPattern('dialog', root)).rejects.toThrow(/dialog "确认删除" #dlg: 没有 aria-modal="true"/);
    });
});

describe('alertdialog', () => {
    it('需要 aria-describedby 指向提示信息', async () => {
        const alert = (described: boolean) => {
            const { root, dlg } = dialogFixture();
            dlg.setAttribute('role', 'alertdialog');
            if (described) {
                dlg.insertAdjacentHTML('afterbegin', '<p id="msg">删除后无法恢复</p>');
                dlg.setAttribute('aria-describedby', 'msg');
            }
            return root;
        };
        await expect(expectPattern('alertdialog', alert(false))).rejects.toThrow(/没有 aria-describedby/);
        await expectPattern('alertdialog', alert(true));
    });
});

describe('disclosure', () => {
    const fixture = (toggle: boolean) => {
        const root = mount(`<div><button aria-expanded="false" aria-controls="d1">详情</button><div id="d1" hidden>内容</div></div>`);
        const button = root.querySelector('button')!;
        if (toggle) {
            button.addEventListener('click', () => button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') === 'false')));
        }
        return root;
    };

    it('Enter 与 Space 都能切换的实现通过', async () => {
        await expectPattern('disclosure', fixture(true));
    });

    it('aria-expanded 不变时报告，actions: false 时只查静态', async () => {
        await expect(expectPattern('disclosure', fixture(false))).rejects.toThrow(/按 Enter 应改变 aria-expanded/);
        await expectPattern('disclosure', fixture(false), { actions: false });
    });
});

describe('accordion', () => {
    const fixture = (heading: boolean) => {
        const root = mount(`<div>
            ${heading ? '<h3>' : '<div>'}<button id="h1" aria-expanded="true" aria-controls="s1">第一节</button>${heading ? '</h3>' : '</div>'}
            <div id="s1" role="region" aria-labelledby="h1">正文</div>
        </div>`);
        const button = root.querySelector('button')!;
        button.addEventListener('click', () => button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') === 'false')));
        return root;
    };

    it('标题包住按钮、面板由按钮命名的实现通过', async () => {
        await expectPattern('accordion', fixture(true));
    });

    it('按钮不在标题里时报告', async () => {
        await expect(expectPattern('accordion', fixture(false))).rejects.toThrow(/button "第一节" #h1: 不在标题元素里/);
    });
});

describe('switch', () => {
    const fixture = (withState: boolean) => {
        const root = mount(`<button role="switch" aria-label="通知" ${withState ? 'aria-checked="false"' : ''}></button>`);
        root.addEventListener('click', () => root.setAttribute('aria-checked', String(root.getAttribute('aria-checked') !== 'true')));
        return root;
    };

    it('Space 切换的实现通过', async () => {
        await expectPattern('switch', fixture(true));
    });

    it('缺少 aria-checked 时点名', async () => {
        await expect(expectPattern('switch', fixture(false))).rejects.toThrow(/switch "通知": 没有 aria-checked/);
    });
});

describe('checkbox', () => {
    it('原生 checkbox 通过，role=checkbox 缺 aria-checked 与名称时点名', async () => {
        await expectPattern('checkbox', mount('<label><input type="checkbox" /> 同意</label>'));
        const message = await expectPattern('checkbox', mount('<div role="checkbox" tabindex="0"></div>'), { actions: false }).catch((error: Error) => error.message);
        expect(message).toMatch(/没有可访问名称/);
        expect(message).toMatch(/没有 aria-checked/);
    });
});

function sliderFixture({ end = true } = {}) {
    const root = mount(`<div role="slider" tabindex="0" aria-label="音量" aria-valuemin="0" aria-valuemax="10" aria-valuenow="5"></div>`);
    root.addEventListener('keydown', (event) => {
        const value = Number(root.getAttribute('aria-valuenow'));
        const next = { ArrowRight: value + 1, ArrowUp: value + 1, ArrowLeft: value - 1, ArrowDown: value - 1, Home: 0, End: end ? 10 : value }[event.key];
        if (next != null) {
            root.setAttribute('aria-valuenow', String(Math.min(10, Math.max(0, next))));
        }
    });
    return root;
}

describe('slider', () => {
    it('方向键、Home、End 的实现通过', async () => {
        await expectPattern('slider', sliderFixture());
    });

    it('sliderKeys 只按指定的一对键，与实现不符时报告', async () => {
        await expectPattern('slider', sliderFixture(), { sliderKeys: { increase: 'ArrowUp', decrease: 'ArrowDown' } });
        await expect(expectPattern('slider', sliderFixture(), { sliderKeys: { increase: 'ArrowDown', decrease: 'ArrowUp' } })).rejects.toThrow(/按 ArrowDown 应增大数值/);
    });

    it('End 不到最大值时报告', async () => {
        await expect(expectPattern('slider', sliderFixture({ end: false }))).rejects.toThrow(/按 End 应设为最大值 10/);
    });

    it('缺少 aria-valuenow 时点名', async () => {
        const root = sliderFixture();
        root.removeAttribute('aria-valuenow');
        await expect(expectPattern('slider', root)).rejects.toThrow(/slider "音量": 没有数值型的 aria-valuenow/);
    });
});
