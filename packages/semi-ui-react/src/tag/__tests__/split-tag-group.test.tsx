import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import Tag from '../index';
import SplitTagGroup from '../split-tag-group';

describe('SplitTagGroup', () => {
    it('渲染 group 并透传原生属性', () => {
        render(
            <SplitTagGroup className="custom" style={{ marginTop: 10 }} aria-label="标签组">
                <Tag>A</Tag>
                <Tag>B</Tag>
            </SplitTagGroup>
        );
        expect(screen.getByRole('group', { name: '标签组' })).toHaveClass('semi-tag-split', 'custom');
        expect(screen.getByRole('group')).toHaveStyle({ marginTop: '10px' });
    });
    it('保留子元素已有 className 与顺序', () => {
        render(
            <SplitTagGroup>
                <Tag className="first">A</Tag>
                <Tag className="last">B</Tag>
            </SplitTagGroup>
        );
        expect(screen.getByRole('group').children[0]).toHaveClass('first');
        expect(screen.getByRole('group').children[1]).toHaveClass('last');
    });
    it('支持单个标签', () => {
        render(
            <SplitTagGroup>
                <Tag>Only</Tag>
            </SplitTagGroup>
        );
        expect(screen.getByRole('group').children).toHaveLength(1);
        expect(screen.getByRole('group')).toHaveTextContent('Only');
    });
    it('保留嵌套标签', () => {
        render(
            <SplitTagGroup>
                <Tag>
                    outer<Tag>nested</Tag>
                </Tag>
                <Tag>B</Tag>
            </SplitTagGroup>
        );
        expect(screen.getByRole('group').children).toHaveLength(2);
        expect(screen.getByText('nested')).toBeInTheDocument();
    });
    it('子元素变化时同步渲染', () => {
        const view = render(
            <SplitTagGroup>
                <Tag key="a">A</Tag>
                <Tag key="b">B</Tag>
            </SplitTagGroup>
        );
        const first = screen.getByRole('group').firstElementChild;
        view.rerender(
            <SplitTagGroup>
                <Tag key="a">A</Tag>
                <Tag key="b">B</Tag>
                <Tag key="c">C</Tag>
            </SplitTagGroup>
        );
        expect(screen.getByRole('group').children).toHaveLength(3);
        expect(screen.getByRole('group').firstElementChild).toBe(first);
        expect(screen.getByRole('group').lastElementChild).toHaveTextContent('C');
    });
    it('跳过空节点并保留文本', () => {
        render(
            <SplitTagGroup>
                {null}
                <Tag>A</Tag>
                {false}text<Tag>B</Tag>
            </SplitTagGroup>
        );
        expect(screen.getByRole('group').children).toHaveLength(2);
        expect(screen.getByRole('group')).toHaveTextContent('AtextB');
    });
    it('Fragment 中的标签直接进入容器', () => {
        render(
            <SplitTagGroup>
                <>
                    <Tag>A</Tag>
                    <Tag>B</Tag>
                </>
            </SplitTagGroup>
        );
        expect(screen.getByRole('group').children).toHaveLength(2);
    });
});
