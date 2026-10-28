import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import SideSheetContent from '../side-sheet-content';

function counter(text: string) {
    const state = { created: 0 };
    const Counted = () => {
        state.created += 1;
        return text;
    };
    return { state, Counted };
}

const sheetSize = { rootWidth: 0, dialogWidth: 0, dialogHeight: '100%' } as never;

it('closable 为 false 时不创建 closeIcon', async () => {
    const icon = counter('icon text');
    const { html, errors } = await renderServer({ render: () => <SideSheetContent closable={false} closeIcon={<icon.Counted />} sheetSize={sheetSize} onClose={() => {}} /> });
    expect(errors).toEqual([]);
    expect(html).not.toContain('icon text');
    expect(icon.state.created).toBe(0);
});

it('closable 时创建一次 closeIcon', async () => {
    const icon = counter('icon text');
    const { html } = await renderServer({ render: () => <SideSheetContent closable closeIcon={<icon.Counted />} sheetSize={sheetSize} onClose={() => {}} /> });
    expect(html).toContain('icon text');
    expect(icon.state.created).toBe(1);
});
