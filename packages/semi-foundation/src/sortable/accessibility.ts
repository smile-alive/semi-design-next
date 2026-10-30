import { Accessibility } from '@dnd-kit/dom';
import { isSortable } from '@dnd-kit/dom/sortable';
import { BASE_CLASS_PREFIX } from '../base/constants';
import type { Locale } from '../locale/interface';

type SortableLocale = Locale['Sortable'];

const position = (index: number) => String(index + 1);

const descriptionPrefix = `${BASE_CLASS_PREFIX}-sortable-description`;

/**
 * dnd-kit accessibility plugin with Semi's locale, speaking positions instead of internal item ids.
 * The locale and item count are read at each event and kept current with `update`.
 */
export class SortableAnnouncer {
    #locale: SortableLocale;
    #total: number;
    // dnd-kit names its instructions element `${idPrefix.description}-${id}`; a known id lets `update` rewrite it
    readonly #id = crypto.randomUUID();
    // dnd-kit reads `draggable` when it creates that element on the first registered handle, which may come after
    // `update`, so the object it holds is kept current
    readonly #instructions: { draggable: string };

    readonly plugin: ReturnType<typeof Accessibility.configure>;

    constructor(locale: SortableLocale, total: number) {
        this.#locale = locale;
        this.#total = total;
        this.#instructions = { draggable: locale.instructions };
        this.plugin = Accessibility.configure({
            id: this.#id,
            idPrefix: { description: descriptionPrefix },
            screenReaderInstructions: this.#instructions,
            announcements: {
                dragstart: ({ operation: { source } }) => (isSortable(source) ? this.#locale.pickedUp.replace('${index}', position(source.initialIndex)).replace('${total}', String(this.#total)) : undefined),
                dragover: ({ operation: { source, target } }) => (isSortable(source) && isSortable(target) && source.id !== target.id ? this.#locale.movedTo.replace('${index}', position(target.index)) : undefined),
                dragend: ({ operation: { source }, canceled }) => {
                    if (!isSortable(source)) {
                        return undefined;
                    }
                    return canceled ? this.#locale.canceled.replace('${index}', position(source.initialIndex)) : this.#locale.dropped.replace('${index}', position(source.index));
                },
            },
        });
    }

    update = (locale: SortableLocale, total: number) => {
        if (locale.instructions !== this.#instructions.draggable) {
            this.#instructions.draggable = locale.instructions;
            const description = document.getElementById(`${descriptionPrefix}-${this.#id}`);
            if (description) {
                description.textContent = locale.instructions;
            }
        }
        this.#locale = locale;
        this.#total = total;
    };
}
