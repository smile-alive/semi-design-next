import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import ModalContent from '../modal-content';

function counter(text: string) {
    const state = { created: 0 };
    const Counted = () => {
        state.created += 1;
        return text;
    };
    return { state, Counted };
}

it('传 header 时不创建 title 与 icon', async () => {
    const title = counter('title text');
    const icon = counter('icon text');
    const { html, errors } = await renderServer({
        render: () => <ModalContent open inBody onClose={() => {}} header={<span>custom header</span>} title={<title.Counted />} icon={<icon.Counted />} />,
    });
    expect(errors).toEqual([]);
    expect(html).toContain('custom header');
    expect(html).not.toContain('title text');
    expect(html).not.toContain('icon text');
    expect(title.state.created).toBe(0);
    expect(icon.state.created).toBe(0);
});

it('不传 header 时 title 与 icon 各创建一次', async () => {
    const title = counter('title text');
    const icon = counter('icon text');
    const { html } = await renderServer({ render: () => <ModalContent open inBody onClose={() => {}} title={<title.Counted />} icon={<icon.Counted />} /> });
    expect(html).toContain('title text');
    expect(title.state.created).toBe(1);
    expect(icon.state.created).toBe(1);
});
