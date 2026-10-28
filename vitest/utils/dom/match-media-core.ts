import { vi } from 'vite-plus/test';

interface MediaListStub {
    media: string;
    matches: boolean;
    handlers: Array<(event: { matches: boolean }) => void>;
    addEventListener: (type: string, handler: MediaListStub['handlers'][number]) => number;
    removeEventListener: (type: string, handler: MediaListStub['handlers'][number]) => void;
}

/**
 * Replaces window.matchMedia with lists matching exactly the queries in `matching` and recording their change
 * handlers, so a test can fire changes and count live subscriptions. Only addEventListener and removeEventListener
 * are implemented, the members Semi reads.
 */
export function mockMatchMediaCore(matching: string[] = []) {
    const lists: Record<string, MediaListStub[]> = {};
    vi.stubGlobal(
        'matchMedia',
        vi.fn<typeof window.matchMedia>((media) => {
            const list: MediaListStub = {
                media,
                matches: matching.includes(media),
                handlers: [],
                addEventListener: vi.fn<MediaListStub['addEventListener']>((_, handler) => list.handlers.push(handler)),
                removeEventListener: vi.fn<MediaListStub['removeEventListener']>((_, handler) => {
                    list.handlers = list.handlers.filter((item) => item !== handler);
                }),
            };
            (lists[media] ??= []).push(list);
            return list as unknown as MediaQueryList;
        })
    );
    const handlerCount = (media: string) => (lists[media] ?? []).reduce((sum, list) => sum + list.handlers.length, 0);
    return {
        lists,
        handlerCount,
        totalHandlers: () => Object.keys(lists).reduce((sum, media) => sum + handlerCount(media), 0),
        fire(media: string, matches: boolean) {
            (lists[media] ?? []).forEach((list) => list.handlers.forEach((handler) => handler({ matches })));
        },
    };
}
