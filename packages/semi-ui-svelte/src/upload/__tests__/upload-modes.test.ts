import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { FileItem } from '../interface';
import { action, createFile, defaultFileList, getCardNames, installFakeXhr, selectFiles, type FakeXhr } from './helpers';
import UploadModes from './upload-modes.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

let requests: FakeXhr[];
beforeEach(() => {
    requests = installFakeXhr();
});

function setup(mode: Mode, list?: FileItem[], accept = true) {
    const store = createStore<{ list: FileItem[] | undefined; accept: boolean; log: string[]; progress: number[] }>({ list, accept, log: [], progress: [] });
    const view = render(UploadModes, { props: { mode, store, action } });
    return { store, view };
}

describe('Upload fileList 的四种写法（Y3）', () => {
    it('不传 fileList：组件自管列表', async () => {
        const { store } = setup('uncontrolled');
        await selectFiles([createFile(10, 'a.png')]);
        expect(getCardNames()).toEqual(['a.png']);
        expect(store.log).toEqual(['change a.png']);
    });

    it('bind:fileList：选择文件写回父级，父级改值同步到界面', async () => {
        const { store } = setup('bind', defaultFileList);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
        await selectFiles([createFile(10, 'a.png')]);
        expect(store.list?.map((item) => item.name)).toEqual(['vigo.png', 'test.jpeg', 'a.png']);
        store.list = [defaultFileList[0]];
        flushSync();
        expect(getCardNames()).toEqual(['vigo.png']);
        await selectFiles([createFile(10, 'b.png')]);
        expect(store.list?.map((item) => item.name)).toEqual(['vigo.png', 'b.png']);
    });

    it('bind:fileList 被设为 undefined（表单重置）时清空列表而不抛错', async () => {
        const { store } = setup('bind', defaultFileList);
        store.list = undefined;
        flushSync();
        expect(getCardNames()).toEqual([]);
        await selectFiles([createFile(10, 'a.png')]);
        expect(getCardNames()).toEqual(['a.png']);
    });

    it('函数绑定：setter 接受时与 bind 一致', async () => {
        const { store } = setup('function', []);
        await selectFiles([createFile(10, 'a.png')]);
        expect(store.log).toContain('set a.png');
        expect(getCardNames()).toEqual(['a.png']);
    });

    it('函数绑定：setter 拒绝时界面保持原列表，被拒绝的文件不上报进度，下次选择基于保留的列表', async () => {
        const { store } = setup('function', [defaultFileList[0]], false);
        await selectFiles([createFile(10, 'rejected.png')]);
        expect(store.log.some((entry) => entry.startsWith('set '))).toBe(true);
        expect(getCardNames()).toEqual(['vigo.png']);
        await requests[0]?.uploadProgress({ loaded: 50, total: 100 });
        expect(getCardNames()).toEqual(['vigo.png']);
        expect(store.progress).toEqual([]);

        store.accept = true;
        await selectFiles([createFile(10, 'accepted.png')]);
        expect(store.list?.map((item) => item.name)).toEqual(['vigo.png', 'accepted.png']);
        expect(getCardNames()).toEqual(['vigo.png', 'accepted.png']);
    });

    it('单向传入：作为初始值，选择文件后本地覆盖，父级再改值时跟随', async () => {
        const { store } = setup('one-way', [defaultFileList[0]]);
        expect(getCardNames()).toEqual(['vigo.png']);
        await selectFiles([createFile(10, 'a.png')]);
        expect(getCardNames()).toEqual(['vigo.png', 'a.png']);
        expect(store.list?.map((item) => item.name)).toEqual(['vigo.png']);
        store.list = [defaultFileList[1]];
        flushSync();
        expect(getCardNames()).toEqual(['test.jpeg']);
    });
});
