import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { IllustrationFailure } from '@fibrae/semi-illustrations-solid';

function urlRefs(svg: Element) {
    return [...svg.querySelectorAll('*')].flatMap((element) => [...element.attributes].flatMap((attr) => [...attr.value.matchAll(/url\(#([^)]+)\)/g)].map(([, ref]) => ref)));
}

describe('semi-illustrations-solid', () => {
    it('同页两个实例的 mask 与渐变 id 互不相同，url() 引用都指向本实例', () => {
        const { container } = render(() => (
            <>
                <IllustrationFailure />
                <IllustrationFailure />
            </>
        ));
        const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const svg of container.querySelectorAll('svg')) {
            const own = new Set([...svg.querySelectorAll('[id]')].map((element) => element.id));
            const refs = urlRefs(svg);
            expect(refs.length).toBeGreaterThan(0);
            expect(refs.filter((ref) => !own.has(ref))).toEqual([]);
        }
    });

    it('作为装饰图形渲染，透传属性并保留 mask-type', () => {
        const { container } = render(() => <IllustrationFailure width={100} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        expect(svg).toHaveAttribute('focusable', 'false');
        expect(svg).toHaveAttribute('width', '100');
        expect(container.querySelector('mask[mask-type]')).toHaveAttribute('mask-type', 'alpha');
    });
});
