import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import { Modal } from '../index';
import ModalFixture from './modal-fixture.svelte';

describe('Svelte Modal 服务端首帧', () => {
    it('默认打开的对话框在服务端不输出：Portal 挂载后才渲染，不访问 document', () => {
        const store = createStore({ props: { visible: true, title: 'Dialog' } });
        const { body } = render(ModalFixture, { props: { store } });
        expect(body).not.toContain('semi-modal');
        expect(body).not.toContain('semi-portal');
    });

    it('keepDOM 的对话框同样不在服务端输出', () => {
        const store = createStore({ props: { visible: false, keepDOM: true } });
        const { body } = render(ModalFixture, { props: { store } });
        expect(body).not.toContain('semi-modal');
    });

    it('命令式 Modal.confirm 在服务端抛出指明 API 的错误，destroyAll 无副作用', () => {
        expect(() => Modal.confirm({ title: 'T' })).toThrow(/Modal\.confirm.*only be called in the browser/);
        expect(() => Modal.destroyAll()).not.toThrow();
    });
});
