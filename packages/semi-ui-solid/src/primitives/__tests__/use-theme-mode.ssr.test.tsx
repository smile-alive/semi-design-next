import { expect, it } from 'vite-plus/test';
import { renderServer, summarizeError } from '@test/solid/ssr.solid';
import useThemeMode from '../use-theme-mode';

it('服务端渲染 useThemeMode 的初值为 light', async () => {
    const { html, errors } = await renderServer({
        render: () => {
            const { mode, preference } = useThemeMode();
            return (
                <p>
                    {mode()}/{preference()}
                </p>
            );
        },
    });
    expect(errors.map(summarizeError)).toEqual([]);
    expect(html).toContain('light');
    expect(html).not.toContain('dark');
});
