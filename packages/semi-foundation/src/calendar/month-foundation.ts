import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

export interface CalendarMonthAdapter<P extends object = object, S extends object = object> extends DefaultAdapter<P, S> {
    notifyClose: (e: any, key: string) => void;
    openCard: (key: string) => void;
}

/** Drives the month view's "more" card */
export default class CalendarMonthFoundation<P extends object = object, S extends object = object> extends BaseFoundation<CalendarMonthAdapter<P, S>, P, S> {
    /** Closes the "more" card from its close button or a mousedown outside */
    closeCard(e: any, key: string) {
        this._adapter.notifyClose(e, key);
    }

    showCard(key: string) {
        this._adapter.openCard(key);
    }
}
