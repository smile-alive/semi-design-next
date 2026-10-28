/** @jsxImportSource vue */
import { createApp, defineComponent, h, type VNode } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { createHolder } from '../holder';
import { nativeTag } from '../native-tag';

function mountWith(register: (app: ReturnType<typeof createApp>) => void, render: () => VNode): HTMLElement {
    const host = document.createElement('div');
    const app = createApp({ render });
    register(app);
    app.mount(host);
    return host;
}

describe('nativeTag', () => {
    it('renders the native element although a component with the capitalized name is registered', () => {
        const Search = defineComponent({ render: () => <section>stub</section> });
        const Div = defineComponent({ render: () => <article>stub</article> });
        const host = mountWith(
            (app) => app.component('Search', Search).component('Div', Div),
            () => (
                <main>
                    {h(nativeTag('search'), { 'aria-label': 'find' }, { default: () => 'a' })}
                    {h(nativeTag('div'), null, { default: () => 'b' })}
                </main>
            )
        );
        expect(host.querySelector('search')?.textContent).toBe('a');
        expect(host.querySelector('div')?.textContent).toBe('b');
        expect(host.querySelector('section, article')).toBeNull();
    });

    it('puts attrs on the element once and keeps the type stable per tag', () => {
        let sticky = 0;
        const host = mountWith(
            () => {},
            () => h(nativeTag('search'), { class: 'x', onClick: () => sticky++ })
        );
        const el = host.querySelector('search') as HTMLElement;
        expect(el.className).toBe('x');
        el.click();
        expect(sticky).toBe(1);
        expect(nativeTag('search')).toBe(nativeTag('search'));
    });
});

describe('createHolder', () => {
    it('renders the closed-over render function and names the component', () => {
        const Holder = createHolder('DemoHolder', () => <p>held</p>);
        const host = mountWith(
            () => {},
            () => h(Holder)
        );
        expect(host.querySelector('p')?.textContent).toBe('held');
        expect((Holder as { name: string }).name).toBe('DemoHolder');
    });
});
