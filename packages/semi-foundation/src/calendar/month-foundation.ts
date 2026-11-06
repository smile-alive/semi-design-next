import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import CalendarFoundation, { type MonthData, type MonthlyEvent } from './foundation';

export interface CalendarMonthBaseState {
    /** The key of the open "more" card; at most one card is open */
    openCardKey: string | undefined;
}

export interface CalendarMonthAdapter<P extends object = object> extends DefaultAdapter<P, CalendarMonthBaseState> {
    notifyClose: (e: any) => void;
    notifyMoreClick: (e: any, date: Date, remaining: number) => void;
}

export default class CalendarMonthFoundation<P extends object = object> extends BaseFoundation<CalendarMonthAdapter<P>, P, CalendarMonthBaseState> {
    static getInitialState(): CalendarMonthBaseState {
        return { openCardKey: undefined };
    }

    /** The "more" button: closes its card when open, otherwise opens it in place of any other open card */
    toggleCard = (e: unknown, key: string, date: Date, remaining: number) => {
        if (this.getState('openCardKey') === key) {
            this.closeCard(e, key);
            return;
        }
        this.setState({ openCardKey: key });
        this.adapter.notifyMoreClick(e, date, remaining);
    };

    /**
     * The close button, Esc, or a mousedown outside. `e` is null when no event closes it; without `key` the open card
     * closes.
     */
    closeCard = (e: unknown, key = this.getState('openCardKey')) => {
        if (key === undefined || this.getState('openCardKey') !== key) {
            return;
        }
        this.setState({ openCardKey: undefined });
        this.adapter.notifyClose(e);
    };

    /** Closes the open card once its cell no longer collapses; call whenever the grid or the item limit changes */
    closeStaleCard = (monthlyData: MonthData, parsedEvents: Record<number, MonthlyEvent>, itemLimit: number) => {
        const key = this.getState('openCardKey');
        if (key !== undefined && CalendarFoundation.isOpenCardStale(key, monthlyData, parsedEvents, itemLimit)) {
            this.closeCard(null, key);
        }
    };
}
