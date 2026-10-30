import FocusTrapHandle from '../utils/focus-handle';
import { handoverFocus } from '../utils/focus-handover';
import { cssClasses } from './constants';

export const byteKB = 1024;
export const byteMB = 1048576;

export const addAreaControlAttributes = ['disabled', 'aria-disabled', 'href', 'tabindex', 'contenteditable'];

// A disabled control still counts, or the area would become a button around it and reopen the blocked dialog
export function containsControl(node: HTMLElement) {
    return FocusTrapHandle.getFocusableElements(node).length > 0 || node.querySelector(':disabled, [aria-disabled="true"]') !== null;
}

export function containsName(node: HTMLElement) {
    return (node.textContent ?? '').trim() !== '' || node.querySelector('[aria-label],[aria-labelledby],[alt]') !== null;
}

/** The position of the card that holds `target`; -1 when it is outside the cards, like the clear button */
export function indexOfCard(cards: ArrayLike<Element>, target: Node) {
    return Array.from(cards).findIndex((card) => card.contains(target));
}

/**
 * Where focus goes once the control that held it left the list (a card removed, cleared, retried or replaced): the
 * remove button of the card now at `index`, else of the last card, else the add area.
 */
export function getFocusHandoverTarget(cards: ArrayLike<Element>, index: number, addArea: HTMLElement | null): HTMLElement | null {
    const card = index >= 0 ? cards[Math.min(index, cards.length - 1)] : undefined;
    const cardTarget = card && (card.querySelector<HTMLElement>(`.${cssClasses.PREFIX}-file-card-close, .${cssClasses.PREFIX}-picture-file-card-close`) ?? FocusTrapHandle.getFocusableElements(card as HTMLElement).find((node) => node instanceof HTMLElement));
    if (cardTarget) {
        return cardTarget;
    }
    if (!addArea) {
        return null;
    }
    return addArea.tabIndex >= 0 ? addArea : (FocusTrapHandle.getFocusableElements(addArea).find((node) => node instanceof HTMLElement) ?? null);
}

/**
 * Remembers which control in the file list held focus. Removing, clearing, retrying or replacing a file (or disabling
 * the Upload) removes that control and sends focus to the body; `restore` runs after each update and hands focus over.
 */
export class ListFocusTracker {
    #focused: { node: Node; index: number } | null = null;

    track = (node: Node, cards: ArrayLike<Element>) => {
        this.#focused = { node, index: indexOfCard(cards, node) };
    };

    // Focus that left on its own must not be pulled back when the card goes away later. A control that is removed
    // while focused blurs too, but is gone by the time the microtask runs.
    untrack = (node: Node) => {
        queueMicrotask(() => {
            if (this.#focused?.node === node && node.isConnected) {
                this.#focused = null;
            }
        });
    };

    restore = (cards: ArrayLike<Element>, addArea: HTMLElement | null) => {
        const lost = this.#focused;
        if (!lost || lost.node.isConnected) {
            return;
        }
        this.#focused = null;
        handoverFocus(lost.node as Element, getFocusHandoverTarget(cards, lost.index, addArea));
    };
}

export function getFileSize(number: number) {
    if (number < byteKB) {
        return `${(number / byteKB).toFixed(2)}KB`;
    } else if (number >= byteKB && number < byteMB) {
        return `${(number / byteKB).toFixed(1)}KB`;
    } else if (number >= byteMB) {
        return `${(number / byteMB).toFixed(1)}MB`;
    }
    return undefined;
}

export function loopFiles(item: FileSystemDirectoryEntry): Promise<Array<FileSystemEntry>> {
    return new Promise((res, rej) => {
        const dirReader = item.createReader();
        let fileList: Array<FileSystemEntry> = [];

        const sequence = () => {
            dirReader.readEntries((entries) => {
                fileList = fileList.concat(entries);

                const isFinished = !entries.length;

                if (isFinished) {
                    res(fileList);
                } else {
                    sequence();
                }
            }, rej);
        };

        sequence();
    });
}

export async function mapFileTree(items: Array<DataTransferItem>) {
    const promises: Array<Promise<File>> = [];
    const _traverseFileTree = async (item: FileSystemEntry) => {
        if (item.isFile) {
            promises.push(
                new Promise((res, rej) => {
                    (item as FileSystemFileEntry).file((file) => {
                        if (item.fullPath && !file.webkitRelativePath) {
                            // dropped files lack webkitRelativePath
                            Object.defineProperty(file, 'webkitRelativePath', {
                                value: item.fullPath.replace(/^\//, ''),
                            });
                        }
                        res(file);
                    }, rej);
                })
            );
        } else if (item.isDirectory) {
            const entries = await loopFiles(item as FileSystemDirectoryEntry);
            for (const entry of entries) {
                await _traverseFileTree(entry);
            }
        }
    };
    // null for items that are not files (e.g. dragged text)
    const roots = items.map((i) => i.webkitGetAsEntry()).filter((entry) => entry !== null);
    // traversal fills `promises` asynchronously, so wait for it first
    const traversals = await Promise.allSettled(roots.map(_traverseFileTree));
    const reads = await Promise.allSettled(promises);
    for (const result of [...traversals, ...reads]) {
        if (result.status === 'rejected') {
            console.error(result.reason);
        }
    }
    return reads.filter((result) => result.status === 'fulfilled').map((result) => result.value);
}
