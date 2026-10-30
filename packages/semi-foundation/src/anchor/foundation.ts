import { debounce, throttle } from 'es-toolkit';
import scrollIntoView, { type CustomBehaviorOptions, type Options } from 'scroll-into-view-if-needed';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { cssClasses } from './constants';

export interface AnchorNode {
    href?: string;
    children?: AnchorNode[];
}

/** `E` is the framework's click or key event that activated a link */
export interface AnchorAdapter<P extends AnchorBaseProps = AnchorBaseProps, S extends AnchorBaseState = AnchorBaseState, E = unknown> extends DefaultAdapter<P, S> {
    getContainer: () => HTMLElement | Window;
    getAnchorNode: (selector: string) => HTMLElement | null;
    getContentNode: (selector: string) => HTMLElement | null;
    notifyChange: (currentLink: string, previousLink: string) => void;
    notifyClick: (e: E, link: string) => void;
}

/** The props the foundation reads */
export interface AnchorBaseProps {
    defaultAnchor?: string;
    scrollMotion?: boolean;
    targetOffset?: number;
    offsetTop?: number;
    scrollIntoViewOptions?: Options;
}

/** The state the foundation reads */
export interface AnchorBaseState {
    activeLink: string;
    links: string[];
    clickLink: boolean;
    slideBarTop: string;
}

export default class AnchorFoundation<P extends AnchorBaseProps = AnchorBaseProps, S extends AnchorBaseState = AnchorBaseState, E = unknown> extends BaseFoundation<AnchorAdapter<P, S, E>, P, S> {
    #container: HTMLElement | Window | null = null;
    #slideBarTop: number | null = null;
    #throttledScroll = throttle(() => this.handleScroll(), 100);
    #debouncedScrollEnd = debounce(() => this.#handleClickLink(), 100);

    #bind() {
        const container = this.adapter.getContainer();
        this.#container = container;
        container.addEventListener('scroll', this.#throttledScroll);
        container.addEventListener('scroll', this.#debouncedScrollEnd);
    }

    #unbind() {
        this.#container?.removeEventListener('scroll', this.#throttledScroll);
        this.#container?.removeEventListener('scroll', this.#debouncedScrollEnd);
        this.#container = null;
    }

    #scrollIntoView(link: string) {
        const { scrollMotion, targetOffset, scrollIntoViewOptions } = this.getProps();
        const behavior = scrollMotion ? 'smooth' : 'auto';
        if (link) {
            const destNode = this.adapter.getContentNode(link);
            const scrollOpts: CustomBehaviorOptions<void> = {
                block: 'start',
                ...scrollIntoViewOptions,
                behavior: (actions) => {
                    const verticalScrollAction = actions.find(({ el }) => {
                        return el.scrollHeight > el.clientHeight;
                    });
                    if (verticalScrollAction) {
                        const { el, top, left } = verticalScrollAction;
                        // horizontal scrolling only when asked for: `left` is computed even without `inline`
                        el.scroll({
                            top: top - targetOffset,
                            left: scrollIntoViewOptions?.inline ? left : undefined,
                            behavior,
                        });
                    }
                },
            };
            if (destNode) {
                scrollIntoView(destNode, scrollOpts);
            }
        }
    }

    #handleClickLink() {
        this.adapter.setState({ clickLink: false } as Pick<S, 'clickLink'>);
    }

    #goToLink(link: string, shouldNotify: boolean) {
        const destNode = this.adapter.getContentNode(link);
        const prevLink = this.adapter.getState('activeLink');
        this.setActiveLink(link, prevLink, shouldNotify);
        if (destNode) {
            this.adapter.setState({ clickLink: true } as Pick<S, 'clickLink'>, () => {
                this.#scrollIntoView(link);
                // no scroll event fires when already in place, so end the click by time too
                this.#debouncedScrollEnd();
            });
        }
    }

    protected setActiveLink(link: string, prevLink: string, shouldNotify = true) {
        const activeLink = this.adapter.getState('activeLink');
        if (activeLink !== link) {
            this.adapter.setState({ activeLink: link } as Pick<S, 'activeLink'>, this.syncSlideBar);
            if (shouldNotify) {
                this.adapter.notifyChange(link, prevLink);
            }
        }
    }

    protected getLinksTop() {
        const container = this.adapter.getContainer();
        const containerTop = 'getBoundingClientRect' in container ? container.getBoundingClientRect().top : 0;
        const { offsetTop } = this.getProps();
        return this.getState('links').map((link) => {
            const node = this.adapter.getContentNode(link);
            // a missing or exactly aligned target counts as far above the top, so it never wins as the active link
            return (node && node.getBoundingClientRect().top - containerTop - offsetTop) || -Infinity;
        });
    }

    protected handleScroll() {
        const { clickLink, links, activeLink: prevActiveLink } = this.getStates();
        if (clickLink) {
            return;
        }
        const elTop = this.getLinksTop();
        let lastNegative = -Infinity;
        let lastNegativeIndex = -1;
        for (let i = 0; i < elTop.length; i++) {
            if (elTop[i] < 0 && elTop[i] > lastNegative) {
                lastNegative = elTop[i];
                lastNegativeIndex = i;
            }
        }
        // no section above the top: '' is the "no active link" value, undefined would differ from it
        this.setActiveLink(links[lastNegativeIndex] ?? '', prevActiveLink);
    }

    /**
     * Maps each href to the hrefs nested below it. Walks the tree because autoCollapse leaves links unmounted;
     * nodes without an href are walked through.
     */
    static getChildMap(children: AnchorNode[] = []) {
        const childMap: Record<string, Set<string>> = {};
        const parents: string[] = [];
        const visit = (node: AnchorNode) => {
            if (node.href) {
                if (!(node.href in childMap)) {
                    childMap[node.href] = new Set();
                }
                for (const parent of parents) {
                    childMap[parent].add(node.href);
                }
                parents.push(node.href);
            }
            node.children?.forEach(visit);
            if (node.href) {
                parents.pop();
            }
        };
        children.forEach(visit);
        return childMap;
    }

    /** Runs once the links have registered: listens to the container, applies `defaultAnchor` */
    override init() {
        this.#bind();
        const { defaultAnchor } = this.getProps();
        if (defaultAnchor) {
            this.#goToLink(defaultAnchor, false);
        }
    }

    override destroy() {
        this.#unbind();
        this.#throttledScroll.cancel();
        this.#debouncedScrollEnd.cancel();
    }

    /** Rebinds scroll listeners when `getContainer` returns a different node */
    handleContainerChange = () => {
        if (this.adapter.getContainer() !== this.#container) {
            this.#unbind();
            this.#bind();
        }
    };

    // Called after every commit, since links above the active one can move it unnoticed; an unchanged position sets no
    // state, so the call cannot re-render in a loop.
    syncSlideBar = () => {
        const linkNode = this.adapter.getAnchorNode(`.${cssClasses.PREFIX}-link-title-active`);
        if (linkNode && linkNode.offsetTop !== this.#slideBarTop) {
            this.#slideBarTop = linkNode.offsetTop;
            this.adapter.setState({ slideBarTop: `${this.#slideBarTop}px` } as Pick<S, 'slideBarTop'>);
        }
    };

    addLink = (link: string) => {
        this.adapter.setState({ links: [...this.getState('links'), link] } as Pick<S, 'links'>);
    };

    removeLink = (link: string) => {
        const links = this.getState('links');
        const index = links.indexOf(link);
        if (index !== -1) {
            this.adapter.setState({ links: links.toSpliced(index, 1) } as Pick<S, 'links'>);
        }
    };

    handleClick = (e: E, link: string) => {
        this.#goToLink(link, true);
        this.adapter.notifyClick(e, link);
    };
}
