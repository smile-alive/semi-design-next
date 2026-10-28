import { describe, expect, it, vi } from 'vite-plus/test';
import { createEditorHandlers, getEditorAttributes } from '../extension/editor-config';
import { isSelectionInsideNode } from '../extension/input-slot';
import AIChatInputFoundation, { type AIChatInputAdapter } from '../foundation';
import type { Attachment } from '../interface';
import { getAttachmentType, getContentType, getListbox, getPastedFiles, transformSelectSlot, transformText } from '../utils';

type RemoveSpy = (file: File, fileList: Attachment[], currentFile: Attachment) => void;
type UploadChangeSpy = (props: { fileList: Attachment[] }) => void;

// The upload notifiers forward to the props as the React adapter does
const asAdapter = (adapter: Partial<Record<keyof AIChatInputAdapter, any>>) =>
    ({
        notifyUploadChange: (p: any) => adapter.getProps?.().onUploadChange?.(p),
        notifyUploadPropsChange: (p: any) => adapter.getProps?.().uploadProps?.onChange?.(p),
        notifyUploadRemove: (...args: any[]) => adapter.getProps?.().uploadProps?.onRemove?.(...args),
        ...adapter,
    }) as unknown as AIChatInputAdapter;

describe('AIChatInputFoundation', () => {
    const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] };
    const textDoc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] };

    it('getCanSend 优先使用 canSend 属性，其次看富文本或附件', () => {
        expect(AIChatInputFoundation.getCanSend(true, undefined, [])).toBe(true);
        expect(AIChatInputFoundation.getCanSend(false, textDoc, [{ uid: '1' } as Attachment])).toBe(false);
        expect(AIChatInputFoundation.getCanSend(undefined, undefined, [])).toBe(false);
        expect(AIChatInputFoundation.getCanSend(undefined, null, undefined)).toBe(false);
        expect(AIChatInputFoundation.getCanSend(undefined, emptyDoc, [])).toBe(false);
        expect(AIChatInputFoundation.getCanSend(undefined, textDoc, [])).toBe(true);
        expect(AIChatInputFoundation.getCanSend(undefined, emptyDoc, [{ uid: '1' } as Attachment])).toBe(true);
    });

    it('getCanSend 在首段为空、后续段落有内容时允许发送', () => {
        const leadingBlank = { type: 'doc', content: [{ type: 'paragraph' }, ...textDoc.content] };
        expect(AIChatInputFoundation.getCanSend(undefined, leadingBlank, [])).toBe(true);
    });

    it('handleGeneratingStart 清空内容、按请求保留 skill，或两者都不动', () => {
        const run = (props, state = {}) => {
            const adapter = {
                getProps: () => props,
                getStates: () => state,
                setContent: vi.fn<AIChatInputAdapter['setContent']>(),
                clearContent: vi.fn<AIChatInputAdapter['clearContent']>(),
                clearAttachments: vi.fn<AIChatInputAdapter['clearAttachments']>(),
            };
            new AIChatInputFoundation(asAdapter(adapter)).handleGeneratingStart();
            return adapter;
        };
        const cleared = run({});
        expect(cleared.clearContent).toHaveBeenCalledTimes(1);
        expect(cleared.clearAttachments).toHaveBeenCalledTimes(1);

        const kept = run({ keepSkillAfterSend: true }, { skill: { value: 'writing', label: 'Writing' } });
        expect(kept.clearContent).not.toHaveBeenCalled();
        expect(kept.setContent).toHaveBeenCalledWith('<p><skill-slot  data-label="Writing" data-value="writing"></skill-slot></p>');
        expect(kept.clearAttachments).toHaveBeenCalledTimes(1);

        const untouched = run({ clearContentOnGenerating: false });
        expect(untouched.clearContent).not.toHaveBeenCalled();
        expect(untouched.setContent).not.toHaveBeenCalled();
        expect(untouched.clearAttachments).not.toHaveBeenCalled();
    });

    it('删除已上传文件时触发 uploadProps.onRemove', async () => {
        const attachment: Attachment = {
            uid: '1',
            name: 'a.png',
            size: '1KB',
            status: 'success',
            fileInstance: { name: 'a.png' } as File,
        };

        const attachments = [attachment];
        const spyOnRemove = vi.fn<RemoveSpy>();
        const spyOnUploadChange = vi.fn<UploadChangeSpy>();
        const spyUploadOnChange = vi.fn<() => void>();

        const adapter = {
            getProps: () => ({
                onUploadChange: spyOnUploadChange,
                uploadProps: {
                    action: 'https://semi.test/upload',
                    onRemove: spyOnRemove,
                    onChange: spyUploadOnChange,
                },
            }),
            getStates: () => ({ attachments }),
            setState: () => {},
        };

        const foundation = new AIChatInputFoundation(asAdapter(adapter));
        foundation.handleUploadFileDelete(attachment);

        await Promise.resolve();

        expect(spyOnRemove).toHaveBeenCalledTimes(1);
        const [file, fileList, currentFile] = spyOnRemove.mock.calls[0];
        expect(file).toEqual(attachment.fileInstance);
        expect(fileList).toEqual([]);
        expect(currentFile.uid).toEqual('1');

        expect(spyOnUploadChange).toHaveBeenCalledTimes(1);
        expect(spyUploadOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnUploadChange.mock.calls[0][0].fileList).toHaveLength(0);
    });

    it('uploadProps.beforeRemove 返回 false 时阻止删除', async () => {
        const attachment: Attachment = {
            uid: '1',
            name: 'a.png',
            size: '1KB',
            status: 'success',
        };
        const attachments = [attachment];

        const spyOnRemove = vi.fn<RemoveSpy>();
        const spyOnUploadChange = vi.fn<UploadChangeSpy>();
        const spyUploadOnChange = vi.fn<() => void>();
        const spyBeforeRemove = vi.fn<() => boolean>(() => false);

        const adapter = {
            getProps: () => ({
                onUploadChange: spyOnUploadChange,
                uploadProps: {
                    action: 'https://semi.test/upload',
                    beforeRemove: spyBeforeRemove,
                    onRemove: spyOnRemove,
                    onChange: spyUploadOnChange,
                },
            }),
            getStates: () => ({ attachments }),
            setState: () => {},
        };

        const foundation = new AIChatInputFoundation(asAdapter(adapter));
        foundation.handleUploadFileDelete(attachment);

        await Promise.resolve();

        expect(spyBeforeRemove).toHaveBeenCalledTimes(1);
        expect(spyOnRemove).not.toHaveBeenCalled();
        expect(spyOnUploadChange).not.toHaveBeenCalled();
        expect(spyUploadOnChange).not.toHaveBeenCalled();
    });

    it('支持 uploadProps.beforeRemove 返回 Promise', async () => {
        const attachment: Attachment = {
            uid: '1',
            name: 'a.png',
            size: '1KB',
            status: 'success',
        };
        const attachments = [attachment];

        const spyOnRemove = vi.fn<RemoveSpy>();
        const spyOnUploadChange = vi.fn<UploadChangeSpy>();
        const spyBeforeRemove = vi.fn<() => Promise<boolean>>(() => Promise.resolve(true));

        const adapter = {
            getProps: () => ({
                onUploadChange: spyOnUploadChange,
                uploadProps: {
                    action: 'https://semi.test/upload',
                    beforeRemove: spyBeforeRemove,
                    onRemove: spyOnRemove,
                },
            }),
            getStates: () => ({ attachments }),
            setState: () => {},
        };

        const foundation = new AIChatInputFoundation(asAdapter(adapter));
        foundation.handleUploadFileDelete(attachment);

        // flush both: outer Promise.resolve and beforeRemove Promise.resolve(true)
        await Promise.resolve();
        await Promise.resolve();

        expect(spyBeforeRemove).toHaveBeenCalledTimes(1);
        expect(spyOnRemove).toHaveBeenCalledTimes(1);
        expect(spyOnUploadChange).toHaveBeenCalledTimes(1);
    });

    it('删除不存在的 uid 时不做任何操作', async () => {
        const attachment: Attachment = {
            uid: 'not-exist',
            name: 'a.png',
            size: '1KB',
            status: 'success',
            fileInstance: { name: 'a.png' } as File,
        };
        const attachments = [{ ...attachment, uid: '1' }];

        const spyOnRemove = vi.fn<RemoveSpy>();
        const spyOnUploadChange = vi.fn<UploadChangeSpy>();
        const spyUploadOnChange = vi.fn<() => void>();

        const adapter = {
            getProps: () => ({
                onUploadChange: spyOnUploadChange,
                uploadProps: {
                    action: 'https://semi.test/upload',
                    onRemove: spyOnRemove,
                    onChange: spyUploadOnChange,
                },
            }),
            getStates: () => ({ attachments }),
            setState: () => {},
        };

        const foundation = new AIChatInputFoundation(asAdapter(adapter));
        foundation.handleUploadFileDelete(attachment);

        await Promise.resolve();

        expect(spyOnRemove).not.toHaveBeenCalled();
        expect(spyOnUploadChange).not.toHaveBeenCalled();
        expect(spyUploadOnChange).not.toHaveBeenCalled();
    });

    it('发送前删除附件时释放它的 blob URL，发送后清空附件时不释放', async () => {
        const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
        const attachment: Attachment = {
            uid: '1',
            name: 'a.png',
            size: '1KB',
            status: 'success',
            url: 'blob:https://semi.test/a',
            fileInstance: new File(['a'], 'a.png', { type: 'image/png' }),
        };
        const adapter = {
            getProps: () => ({}),
            getStates: () => ({ attachments: [attachment] }),
            setState: () => {},
            setContent: () => {},
            clearContent: () => {},
            clearAttachments: () => {},
        };
        const foundation = new AIChatInputFoundation(asAdapter(adapter));

        // the url was handed to onMessageSend, so the owner keeps using it
        foundation.handleGeneratingStart();
        expect(revoke).not.toHaveBeenCalled();

        foundation.handleUploadFileDelete(attachment);
        await Promise.resolve();
        expect(revoke).toHaveBeenCalledTimes(1);
        expect(revoke).toHaveBeenCalledWith('blob:https://semi.test/a');
        revoke.mockRestore();
    });

    const skillPanel = (initialState = {}) => {
        let state: Record<string, any> = { skillVisible: false, suggestionVisible: false, activeSkillIndex: 0 };
        state = { ...state, ...initialState };
        const editor = { text: '', getText: () => editor.text };
        const adapter = {
            getProps: () => ({
                skillHotKey: '/',
                skills: [
                    { value: 'a', label: 'A' },
                    { value: 'b', label: 'B' },
                    { value: 'c', label: 'C' },
                ],
            }),
            getStates: () => state,
            setState: (next: Record<string, any>) => {
                state = { ...state, ...next };
            },
            getEditor: () => editor,
            getOptionNode: () => null,
        };
        const foundation = new AIChatInputFoundation(asAdapter(adapter));
        const press = (key: string) => foundation.handleKeyDown({ key, preventDefault: () => {} });
        return { press, editor, state: () => state };
    };

    it('用热键重新打开 skill 面板时高亮回到第一项', () => {
        const { press, editor, state } = skillPanel();
        press('/');
        editor.text = '/';
        press('ArrowDown');
        press('ArrowDown');
        expect(state().activeSkillIndex).toBe(2);
        press('Escape');
        editor.text = '';
        press('/');
        expect(state().skillVisible).toBe(true);
        expect(state().activeSkillIndex).toBe(0);
    });

    it('skill 面板打开期间文本不只是热键时，方向键仍移动高亮', () => {
        const { press, editor, state } = skillPanel({ skillVisible: true });
        editor.text = '/x';
        press('ArrowDown');
        expect(state().activeSkillIndex).toBe(1);
        press('ArrowUp');
        press('ArrowUp');
        expect(state().activeSkillIndex).toBe(2);
    });

    it('输入法组合中的 Enter 与方向键不选中也不切换 skill', () => {
        const { editor, state } = skillPanel({ skillVisible: true });
        const foundation = new AIChatInputFoundation(
            asAdapter({
                getProps: () => ({ skillHotKey: '/', skills: [{ value: 'a' }, { value: 'b' }] }),
                getStates: () => state(),
                setState: () => {
                    throw new Error('state must not change while composing');
                },
                getEditor: () => editor,
                getOptionNode: () => null,
            })
        );
        const composing = (key: string) => foundation.handleKeyDown({ key, preventDefault: () => {}, nativeEvent: { isComposing: true } });
        composing('ArrowDown');
        composing('Enter');
        composing('Escape');
        expect(() => foundation.handleKeyDown({ key: 'Enter', preventDefault: () => {}, isComposing: true })).not.toThrow();
        expect(state().skillVisible).toBe(true);
    });

    it('uploadProps.disabled 时粘贴的文件不上传', () => {
        const manualUpload = vi.fn<AIChatInputAdapter['manualUpload']>();
        const make = (disabled: boolean) => new AIChatInputFoundation(asAdapter({ getProps: () => ({ uploadProps: { disabled } }), manualUpload }));
        const files = [new File([''], 'a.png')];
        make(true).handlePaste(files);
        expect(manualUpload).not.toHaveBeenCalled();
        make(false).handlePaste(files);
        expect(manualUpload).toHaveBeenCalledWith(files);
    });

    it('hidePanels 关闭模板、skill 与建议面板', () => {
        let state: Record<string, any> = { templateVisible: true, skillVisible: true, suggestionVisible: true };
        const foundation = new AIChatInputFoundation(
            asAdapter({
                getStates: () => state,
                setState: (next: Record<string, any>) => {
                    state = { ...state, ...next };
                },
            })
        );
        foundation.hidePanels();
        expect(state).toEqual({ templateVisible: false, skillVisible: false, suggestionVisible: false });
    });

    it('handleCreate 把初始内容的转换结果交给 adapter，不触发 onContentChange', () => {
        const setTransformedContent = vi.fn<AIChatInputAdapter['setTransformedContent']>();
        const notifyContentChange = vi.fn<AIChatInputAdapter['notifyContentChange']>();
        const foundation = new AIChatInputFoundation(
            asAdapter({
                getProps: () => ({}),
                setState: () => {},
                getEditor: () => ({ getJSON: () => textDoc }),
                setTransformedContent,
                notifyContentChange,
            })
        );
        foundation.handleCreate();
        expect(setTransformedContent).toHaveBeenCalledWith([{ type: 'text', text: 'hi' }]);
        expect(notifyContentChange).not.toHaveBeenCalled();
    });

    describe('点击容器', () => {
        const click = (focus: 'control' | 'send' | 'root' | 'outside') => {
            const root = document.createElement('div');
            const configure = document.createElement('div');
            configure.className = 'semi-aiChatInput-footer-configure';
            const select = document.createElement('button');
            configure.append(select);
            const send = document.createElement('button');
            const editorDiv = document.createElement('div');
            root.append(configure, send, editorDiv);
            const focusEditor = vi.fn<AIChatInputAdapter['focusEditor']>();
            const active = { control: select, send, root, outside: document.body }[focus];
            const foundation = new AIChatInputFoundation(
                asAdapter({
                    getProps: () => ({}),
                    getRichTextDiv: () => editorDiv as HTMLDivElement,
                    getActiveElement: () => active,
                    focusEditor,
                })
            );
            foundation.handleContainerClick({ target: root, detail: 1 });
            return focusEditor;
        };

        it('焦点已在 configure 区的控件上时不把焦点拉回编辑器', () => {
            expect(click('control')).not.toHaveBeenCalled();
        });

        it('鼠标点击发送按钮后仍聚焦编辑器', () => {
            expect(click('send')).toHaveBeenCalled();
        });

        it('点击空白处（焦点在根元素上或不在组件内）仍聚焦编辑器', () => {
            expect(click('root')).toHaveBeenCalled();
            expect(click('outside')).toHaveBeenCalled();
        });
    });
});

describe('aiChatInput utils', () => {
    it('getContentType 的扩展名映射不被重复键覆盖', () => {
        expect(getContentType('ts')).toBe('code');
        expect(getContentType('rs')).toBe('code');
        expect(getContentType('mid')).toBe('audio');
        expect(getContentType('mp4')).toBe('video');
    });

    it('getPastedFiles 在剪贴板有正文文本时不取文件，否则每项只取一次', () => {
        const file = new File(['x'], 'a.png');
        const getAsFile = vi.fn<() => File | null>(() => file);
        const clipboard = (text: string) => ({ getData: () => text, items: [{ getAsFile }, { getAsFile: () => null }] }) as unknown as DataTransfer;
        expect(getPastedFiles(clipboard('body'))).toEqual([]);
        expect(getAsFile).not.toHaveBeenCalled();
        expect(getPastedFiles(clipboard(' \n'))).toEqual([file]);
        expect(getAsFile).toHaveBeenCalledTimes(1);
        expect(getPastedFiles(null)).toEqual([]);
    });

    it('transformText 去掉与文本合并的零宽字符', () => {
        expect(transformText({ text: '﻿' }).text).toBe('');
        expect(transformText({ text: 'a﻿b' }).text).toBe('ab');
    });

    it('附件类型取小写扩展名，没有扩展名时回退到 MIME 子类型', () => {
        expect(getAttachmentType({ uid: '1', name: 'PHOTO.PNG' } as Attachment)).toBe('png');
        expect(
            getAttachmentType({
                uid: '2',
                name: 'README',
                fileInstance: new File([''], 'README', { type: 'text/plain' }),
            } as Attachment)
        ).toBe('plain');
        expect(getAttachmentType({ uid: '3', name: 'README' } as Attachment)).toBe('UNKNOWN');
    });

    describe('getListbox', () => {
        const ids = { skillListId: 'skill', suggestionListId: 'sug' };
        const state = { templateVisible: false, skillVisible: false, suggestionVisible: false, activeSkillIndex: 1, activeSuggestionIndex: 2 };
        const data = { skills: [{ label: 'a' }], suggestions: [{ label: 'b' }] } as any;

        it('模板面板可见时没有 listbox', () => {
            expect(getListbox({ ...state, templateVisible: true, skillVisible: true }, data, ids)).toBeUndefined();
        });

        it('skill 面板用 skill 列表，列表为空时不回退到 suggestion', () => {
            expect(getListbox({ ...state, skillVisible: true, suggestionVisible: true }, data, ids)).toEqual({ id: 'skill', activeId: 'skill-option-1' });
            expect(getListbox({ ...state, skillVisible: true, suggestionVisible: true }, { suggestions: data.suggestions }, ids)).toBeUndefined();
        });

        it('suggestion 面板有 suggestions 才有 listbox', () => {
            expect(getListbox({ ...state, suggestionVisible: true }, data, ids)).toEqual({ id: 'sug', activeId: 'sug-option-2' });
            expect(getListbox({ ...state, suggestionVisible: true }, { suggestions: [] }, ids)).toBeUndefined();
            expect(getListbox(state, data, ids)).toBeUndefined();
        });
    });

    describe('isSelectionInsideNode', () => {
        it('选区严格落在节点内部才为真', () => {
            expect(isSelectionInsideNode({ from: 6, to: 7 }, 5, 4)).toBe(true);
            expect(isSelectionInsideNode({ from: 5, to: 7 }, 5, 4)).toBe(false);
            expect(isSelectionInsideNode({ from: 6, to: 9 }, 5, 4)).toBe(false);
            expect(isSelectionInsideNode({ from: 20, to: 21 }, 5, 4)).toBe(false);
            expect(isSelectionInsideNode({ from: 6, to: 7 }, undefined, 4)).toBe(false);
        });
    });

    describe('editor config', () => {
        it('aria 属性只在字符串 placeholder 与 controls 存在时输出', () => {
            expect(getEditorAttributes({ id: 'e', label: 'L' })).toEqual({ id: 'e', 'aria-label': 'L' });
            expect(getEditorAttributes({ id: 'e', label: 'L', placeholder: () => 'x' })).not.toHaveProperty('aria-placeholder');
            expect(getEditorAttributes({ id: 'e', label: 'L', placeholder: 'p', controls: 'c', activeDescendant: 'a' })).toEqual({
                id: 'e',
                'aria-label': 'L',
                'aria-placeholder': 'p',
                'aria-autocomplete': 'list',
                'aria-controls': 'c',
                'aria-activedescendant': 'a',
            });
        });

        it('输入法组合中不处理文本输入，compositionend 延迟清理', () => {
            vi.useFakeTimers();
            try {
                const handlers = createEditorHandlers();
                expect(handlers.handleTextInput({ composing: true } as any, 0, 0, 'a')).toBe(false);
                const read = vi.fn<() => void>();
                const view = {
                    get isDestroyed() {
                        read();
                        return true;
                    },
                } as any;
                expect(handlers.handleDOMEvents.compositionend(view)).toBe(false);
                vi.advanceTimersByTime(59);
                expect(read).not.toHaveBeenCalled();
                vi.advanceTimersByTime(1);
                expect(read).toHaveBeenCalledTimes(1);
            } finally {
                vi.useRealTimers();
            }
        });

        it('粘贴文件交给回调并阻止默认行为', () => {
            const onPasteFiles = vi.fn<(files: File[]) => void>();
            const file = new File([''], 'a.png');
            const preventDefault = vi.fn<() => void>();
            const event = { preventDefault, clipboardData: { getData: () => '', items: [{ getAsFile: () => file }] } } as any;
            expect(createEditorHandlers(onPasteFiles).handlePaste({} as any, event)).toBe(true);
            expect(onPasteFiles).toHaveBeenCalledWith([file]);
            expect(preventDefault).toHaveBeenCalled();
        });
    });

    it('未选值的 select-slot 不把零宽字符输出到内容', () => {
        expect(transformSelectSlot({ attrs: { value: '﻿' } }).text).toBe('');
        expect(transformSelectSlot({ attrs: { value: 'a' } }).text).toBe('a');
    });
});
