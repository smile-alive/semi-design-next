import { useRef } from 'react';
import { describe, expect, it } from 'vite-plus/test';
import TagInput from '@fibrae/semi-ui-react/tag-input';
import Upload from '@fibrae/semi-ui-react/upload';
import { renderWithoutDocument } from '@test/utils/react';
import useClickOutside from '../use-click-outside';

function ClickOutsideProbe() {
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside([ref], () => {}, true);
    return <div ref={ref}>ok</div>;
}

describe('没有 document 的服务端渲染', () => {
    it('使用 useClickOutside 的组件不抛 ReferenceError', () => {
        expect(renderWithoutDocument(<ClickOutsideProbe />)).toBe('<div>ok</div>');
    });

    it('TagInput 与 Upload 不在渲染期读取 document', () => {
        expect(() => renderWithoutDocument(<TagInput />)).not.toThrow();
        expect(() => renderWithoutDocument(<Upload action="" />)).not.toThrow();
    });
});
