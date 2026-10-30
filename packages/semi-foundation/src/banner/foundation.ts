import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

/** E is the host's click event, which the foundation only passes through */
export interface BannerAdapter<P extends object = object, S extends object = object, E = unknown> extends DefaultAdapter<P, S> {
    hide: () => void;
    notifyClose: (e: E) => void;
}

export default class BannerFoundation<P extends object = object, S extends object = object, E = unknown> extends BaseFoundation<BannerAdapter<P, S, E>, P, S> {
    removeBanner = (e: E) => {
        this.adapter.notifyClose(e);
        this.adapter.hide();
    };
}
