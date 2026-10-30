import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { Upload } from '..';

describe('Svelte Upload 服务端首帧', () => {
    it('首帧带文件列表、文件名与列表语义，隐藏 input 不可聚焦', () => {
        const { body } = render(Upload, {
            props: {
                action: 'https://example.com/upload',
                fileList: [
                    { uid: '1', name: 'vigo.png', status: 'success', size: '130KB' },
                    { uid: '2', name: 'test.jpeg', status: 'uploadFail', size: '222KB' },
                ],
            },
        });
        expect(body).toContain('semi-upload-file-card');
        expect(body).toContain('vigo.png');
        expect(body).toContain('test.jpeg');
        expect(body).toMatch(/class="[^"]*semi-upload-file-list-main[^"]*"[^>]*role="list"|role="list"[^>]*class="[^"]*semi-upload-file-list-main/);
        expect(body).toMatch(/<input[^>]*class="semi-upload-hidden-input"[^>]*tabindex="-1"|<input[^>]*tabindex="-1"[^>]*class="semi-upload-hidden-input"/);
        expect(body).not.toContain('webkitdirectory');
    });

    it('draggable 的拖拽区首帧显示默认文案，带按钮语义', () => {
        const { body } = render(Upload, { props: { action: 'https://example.com/upload', draggable: true } });
        expect(body).toContain('semi-upload-drag-area');
        expect(body).toContain('点击上传文件或拖拽文件到这里');
        expect(body).toContain('role="button"');
    });

    it('图片墙首帧带图片卡与添加按钮，directory 输出 webkitdirectory', () => {
        const { body } = render(Upload, {
            props: {
                action: 'https://example.com/upload',
                directory: true,
                listType: 'picture',
                fileList: [{ uid: '1', name: 'a.png', status: 'success', size: '1KB', url: 'https://example.com/a.png' }],
            },
        });
        expect(body).toContain('semi-upload-picture-file-card');
        expect(body).toContain('semi-upload-picture-add');
        expect(body).toContain('webkitdirectory');
    });
});
