import { describe, expect, it, vi } from 'vite-plus/test';
import UploadFoundation, { type BaseFileItem, type UploadAdapter } from '../foundation';

/**
 * Drives the foundation with a controlled fileList whose parent writes back on commit: the prop keeps the old list
 * until `flush()` runs the setState callbacks, so steps of one synchronous batch must build on the latest list.
 */
describe('Upload foundation 批量 autoRemove (#3335)', () => {
    const createFoundation = ({ initialFileList, beforeUpload, ...uploadProps }) => {
        const state = { fileList: initialFileList.slice() };
        let controlledList = initialFileList.slice();
        let pendingWrite = null;
        const callbacks: Array<() => void> = [];
        const changes = [];

        const getProps = () => ({ beforeUpload, ...uploadProps, fileList: controlledList });
        const adapter = {
            getContext: () => undefined,
            getContexts: () => ({}),
            getProp: (key) => getProps()[key],
            getProps,
            getState: (key) => state[key],
            getStates: () => ({ ...state, replaceUid: 'a' }),
            setState: (next, callback) => {
                Object.assign(state, next);
                if (callback) {
                    callbacks.push(callback);
                }
            },
            notifyFileSelect: () => {},
            resetReplaceInput: () => {},
            notifyChange: ({ fileList }) => {
                changes.push(fileList);
                pendingWrite = fileList;
            },
            notifyProgress: () => {},
            notifyBeforeUpload: ({ file, fileList }) => beforeUpload({ file, fileList }),
        } as unknown as UploadAdapter;

        const foundation = new UploadFoundation(adapter);
        const flush = () => {
            while (pendingWrite !== null || callbacks.length > 0) {
                if (pendingWrite !== null) {
                    controlledList = pendingWrite;
                    pendingWrite = null;
                }
                callbacks.splice(0).forEach((callback) => callback());
            }
            return state.fileList;
        };
        const setCommittedFileList = (fileList) => {
            controlledList = fileList.slice();
            state.fileList = fileList.slice();
            pendingWrite = null;
        };
        return { foundation, flush, setCommittedFileList, getChanges: () => changes };
    };

    const makeFile = (uid: string) => ({ uid, name: `${uid}.png`, size: '10KB', status: 'wait', fileInstance: { uid } }) as unknown as BaseFileItem;

    const expectNoStaleBatch = ({ foundation, flush, setCommittedFileList }) => {
        const fileX = makeFile('x');
        setCommittedFileList([fileX]);
        foundation.manualUpload();
        expect(flush()).toEqual([]);
    };

    it('多个文件同步返回 autoRemove 时移除全部文件', () => {
        const fileA = makeFile('a');
        const fileB = makeFile('b');

        const beforeUpload = () => ({ shouldUpload: false, autoRemove: true });
        const { foundation, flush } = createFoundation({ initialFileList: [fileA, fileB], beforeUpload });

        foundation.manualUpload();

        expect(flush()).toEqual([]);
    });

    it('移除交错进行时，只保留非 autoRemove 的文件', () => {
        const fileA = makeFile('a');
        const fileB = makeFile('b');
        const fileC = makeFile('c');

        const beforeUpload = ({ file }) => (file.uid === 'b' ? { shouldUpload: false, autoRemove: false } : { shouldUpload: false, autoRemove: true });
        const { foundation, flush } = createFoundation({ initialFileList: [fileA, fileB, fileC], beforeUpload });

        foundation.manualUpload();

        const result = flush();
        expect(result.map((f) => f.uid)).toEqual(['b']);
    });

    it('单个文件的替换上传读取最新列表，之后同步的列表不被旧快照遮住', () => {
        const fileA = makeFile('a');
        const fileB = makeFile('b');

        const beforeUpload = () => ({ shouldUpload: false, autoRemove: true });
        const created = vi.fn<typeof URL.createObjectURL>(() => 'blob:replaced');
        const originalCreate = URL.createObjectURL;
        const originalRevoke = URL.revokeObjectURL;
        URL.createObjectURL = created;
        URL.revokeObjectURL = vi.fn<typeof URL.revokeObjectURL>();
        try {
            const fixture = createFoundation({ initialFileList: [fileA, fileB], beforeUpload });

            // a single upload (the replace flow) is not part of a manualUpload batch
            const replacement = Object.assign(new File(['x'], 'a.png', { type: 'image/png' }), { uid: 'a' });
            fixture.foundation.handleReplaceChange([replacement]);
            expect(fixture.flush().map((f) => f.uid)).toEqual(['b']);
            expectNoStaleBatch(fixture);
        } finally {
            URL.createObjectURL = originalCreate;
            URL.revokeObjectURL = originalRevoke;
        }
    });

    it('组合同步与异步 beforeUpload 结果（先同步移除，再异步移除）', async () => {
        const fileA = makeFile('a');
        const fileB = makeFile('b');

        const beforeUpload = ({ file }) => {
            if (file.uid === 'a') {
                return { shouldUpload: false, autoRemove: true };
            }
            return Promise.resolve({ shouldUpload: false, autoRemove: true });
        };
        const { foundation, flush } = createFoundation({ initialFileList: [fileA, fileB], beforeUpload });

        foundation.manualUpload();
        expect(flush().map((f) => f.uid)).toEqual(['b']);

        await Promise.resolve();
        await Promise.resolve();
        expect(flush()).toEqual([]);
    });

    it('被外部受控 fileList 替换的文件不会复活', async () => {
        const fileA = makeFile('a');
        const fileB = makeFile('b');
        const externalFile = makeFile('external');
        let resolveFileB;

        const beforeUpload = ({ file }) => {
            if (file.uid === 'a') {
                return { shouldUpload: false, autoRemove: true };
            }
            return new Promise((resolve) => {
                resolveFileB = resolve;
            });
        };
        const { foundation, flush, setCommittedFileList, getChanges } = createFoundation({
            initialFileList: [fileA, fileB],
            beforeUpload,
        });

        foundation.manualUpload();
        expect(flush().map((f) => f.uid)).toEqual(['b']);

        // the parent replaces the controlled list while file B's beforeUpload is pending
        setCommittedFileList([externalFile]);
        resolveFileB({ shouldUpload: false, status: 'uploadFail' });
        await Promise.resolve();
        await Promise.resolve();

        expect(flush().map((f) => f.uid)).toEqual(['external']);
        expect(getChanges()).toHaveLength(1);
    });

    it('customRequest 同步上报进度时，已移除的文件不会复活', () => {
        const fileA = makeFile('a');
        const fileB = makeFile('b');
        const beforeUpload = ({ file }) => (file.uid === 'a' ? { shouldUpload: false, autoRemove: true } : true);
        const customRequest = ({ onProgress }) => {
            onProgress({ total: 100, loaded: 50 });
        };
        const originalXMLHttpRequest = global.XMLHttpRequest;
        const originalFormData = global.FormData;
        // constructors are never used: customRequest replaces the XHR path
        global.XMLHttpRequest = vi.fn<() => void>() as unknown as typeof XMLHttpRequest;
        global.FormData = vi.fn<() => void>() as unknown as typeof FormData;
        try {
            const { foundation, flush } = createFoundation({
                initialFileList: [fileA, fileB],
                beforeUpload,
                customRequest,
            });

            foundation.manualUpload();

            const result = flush();
            expect(result.map((f) => f.uid)).toEqual(['b']);
            expect(result[0]).toMatchObject({ status: 'uploading', percent: 48 });
        } finally {
            global.XMLHttpRequest = originalXMLHttpRequest;
            global.FormData = originalFormData;
        }
    });

    it('beforeUpload 抛错后，之后同步的列表仍会被上传', () => {
        const fileA = makeFile('a');
        const fileB = makeFile('b');

        const beforeUpload = ({ file }) => {
            if (file.uid === 'b') {
                throw new Error('boom');
            }
            return { shouldUpload: false, autoRemove: true };
        };
        const fixture = createFoundation({ initialFileList: [fileA, fileB], beforeUpload });

        expect(() => fixture.foundation.manualUpload()).toThrow('boom');
        expect(fixture.flush().map((f) => f.uid)).toEqual(['b']);
        expectNoStaleBatch(fixture);
    });
});
