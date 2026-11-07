import { describe, expect, it, vi } from 'vite-plus/test';
import { mapFileTree } from '../utils';

const fileEntry = (name: string, fullPath: string) =>
    ({
        isFile: true,
        isDirectory: false,
        name,
        fullPath,
        file: (cb: (file: File) => void) => cb(new File(['x'], name)),
    }) as unknown as FileSystemEntry;

// readEntries delivers the children in batches and signals the end with an empty batch
const dirEntry = (name: string, batches: FileSystemEntry[][]) =>
    ({
        isFile: false,
        isDirectory: true,
        name,
        fullPath: `/${name}`,
        createReader: () => {
            const queue = [...batches, []];
            return { readEntries: (cb: (entries: FileSystemEntry[]) => void) => cb(queue.shift()) };
        },
    }) as unknown as FileSystemEntry;

const item = (entry: FileSystemEntry | null) => ({ webkitGetAsEntry: () => entry }) as unknown as DataTransferItem;

describe('mapFileTree', () => {
    it('单个文件条目返回该文件，并按 fullPath 补上 webkitRelativePath', async () => {
        const files = await mapFileTree([item(fileEntry('a.png', '/dir/a.png'))]);
        expect(files.map((f) => [f.name, f.webkitRelativePath])).toEqual([['a.png', 'dir/a.png']]);
    });

    it('目录按批读取，嵌套目录中的文件全部返回', async () => {
        const nested = dirEntry('sub', [[fileEntry('c.txt', '/root/sub/c.txt')]]);
        const root = dirEntry('root', [[fileEntry('a.txt', '/root/a.txt'), fileEntry('b.txt', '/root/b.txt')], [nested]]);
        const files = await mapFileTree([item(root)]);
        expect(files.map((f) => f.name).sort()).toEqual(['a.txt', 'b.txt', 'c.txt']);
    });

    it('空目录返回空数组', async () => {
        expect(await mapFileTree([item(dirEntry('empty', []))])).toEqual([]);
    });

    it('其中一项没有 entry 时，其余文件仍然返回', async () => {
        const files = await mapFileTree([item(null), item(fileEntry('a.png', '/a.png'))]);
        expect(files.map((f) => f.name)).toEqual(['a.png']);
    });

    it('其中一个文件读取失败时跳过它并报告错误，其余文件仍然返回', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const broken = Object.assign(fileEntry('broken.png', '/broken.png'), {
            file: (_: unknown, fail: (reason: Error) => void) => fail(new Error('unreadable')),
        });
        const files = await mapFileTree([item(broken), item(fileEntry('a.png', '/a.png'))]);
        expect(files.map((f) => f.name)).toEqual(['a.png']);
        expect(error).toHaveBeenCalledTimes(1);
        error.mockRestore();
    });

    it('webkitRelativePath 是不可改写的自有属性，且不在 entry 上留下 path', async () => {
        const entry = fileEntry('a.png', '/dir/a.png');
        const [file] = await mapFileTree([item(entry)]);
        expect(Object.getOwnPropertyDescriptor(file, 'webkitRelativePath')).toMatchObject({
            value: 'dir/a.png',
            writable: false,
        });
        expect('path' in entry).toBe(false);
    });
});
