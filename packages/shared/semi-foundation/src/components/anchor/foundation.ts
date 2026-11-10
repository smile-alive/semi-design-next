import { debounce, throttle } from 'es-toolkit';
import scrollIntoView, { type CustomBehaviorOptions, type Options } from 'scroll-into-view-if-needed';
import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import { cssClasses } from './constants';
import { findAnchorTarget } from './utils';

export interface AnchorNode {
    href?: string;
    children?: AnchorNode[];
}

/** `E` is the framework's click or key event that activated a link */
export interface AnchorAdapter<P extends AnchorBaseProps = AnchorBaseProps, E = unknown> extends DefaultAdapter<P, AnchorBaseState> {
    /** The scroll container, which the foundation falls back to the window for when it is null */
    getContainer: () => HTMLElement | Window | null;
    getRoot: () => HTMLElement | null;
    notifyChange: (currentLink: string, previousLink: string) => void;
    notifyClick: (e: E, link: string) => void;
}

export interface AnchorBaseProps {
    autoCollapse?: boolean;
    defaultAnchor?: string;
    scrollMotion?: boolean;
    targetOffset?: number;
    offsetTop?: number;
    scrollIntoViewOptions?: Options;
}

export interface AnchorBaseState {
    activeLink: string;
    links: string[];
    /** Href of the link each registered link is nested in, as `addLink` received it */
    linkParents: Record<string, string>;
    clickLink: boolean;
    slideBarTop: string;
}

export default class AnchorFoundation<P extends AnchorBaseProps = AnchorBaseProps, E = unknown> extends BaseFoundation<AnchorAdapter<P, E>, P, AnchorBaseState> {
    #container: HTMLElement | Window | null = null;
    #slideBarTop: number | null = null;
    #activeFromScroll = false;
    #throttledScroll = throttle(() => this.handleScroll(), 100);
    #debouncedScrollEnd = debounce(() => this.#handleClickLink(), 100);

    #getContainer() {
        return this.adapter.getContainer() ?? window;
    }

    #getContentNode(link: string) {
        return findAnchorTarget(this.adapter.getRoot(), link);
    }

    #bind() {
        const container = this.#getContainer();
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
            const destNode = this.#getContentNode(link);
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
        this.setState({ clickLink: false });
    }

    #goToLink(link: string, shouldNotify: boolean) {
        const destNode = this.#getContentNode(link);
        const prevLink = this.getState('activeLink');
        this.#activeFromScroll = false;
        this.setActiveLink(link, prevLink, shouldNotify);
        if (destNode) {
            this.setState({ clickLink: true }, () => {
                this.#scrollIntoView(link);
                // no scroll event fires when already in place, so end the click by time too
                this.#debouncedScrollEnd();
            });
        }
    }

    // An autoCollapse branch mounts its links only once a scroll made its parent active, and no scroll event follows
    // a jump: pick again among the links now mounted. A link chosen by click or defaultAnchor stays, and before the
    // first scroll mounting picks nothing.
    #rescanAfterCommit() {
        if (this.getProp('autoCollapse') && this.#activeFromScroll) {
            // not the throttled handler: a host that commits synchronously (Solid) lands here inside its leading call,
            // and es-toolkit drops a call made while the leading one runs
            this.handleScroll();
        }
    }

    // runs once the links have registered
    protected override initOnce() {
        const { defaultAnchor } = this.getProps();
        if (defaultAnchor) {
            this.#goToLink(defaultAnchor, false);
        }
    }

    protected setActiveLink(link: string, prevLink: string, shouldNotify = true) {
        const activeLink = this.getState('activeLink');
        if (activeLink !== link) {
            this.setState({ activeLink: link }, this.syncSlideBar);
            if (shouldNotify) {
                this.adapter.notifyChange(link, prevLink);
            }
        }
    }

    protected getLinksTop() {
        const container = this.#getContainer();
        const containerTop = 'getBoundingClientRect' in container ? container.getBoundingClientRect().top : 0;
        const { offsetTop } = this.getProps();
        return this.getState('links').map((link) => {
            const node = this.#getContentNode(link);
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
        this.#activeFromScroll = true;
        this.setActiveLink(links[lastNegativeIndex] ?? '', prevActiveLink);
    }

    /** `links` is for hosts that know theirs up front, as with `setLinks` */
    static getInitialState(links: string[] = []): AnchorBaseState {
        return { activeLink: '', links, linkParents: {}, clickLink: false, slideBarTop: '0' };
    }

    /** Like `getChildMap`, from the parents the mounted links registered: it reaches links that other components render */
    static getRegisteredChildMap(linkParents: Record<string, string>) {
        return AnchorFoundation.getChildMap(
            Object.keys(linkParents).map((href) => {
                let node: AnchorNode = { href };
                const seen = new Set([href]);
                for (let parent = linkParents[href]; parent && !seen.has(parent); parent = linkParents[parent]) {
                    seen.add(parent);
                    node = { href: parent, children: [node] };
                }
                return node;
            })
        );
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

    override init() {
        this.#bind();
    }

    override destroy() {
        this.#unbind();
        this.#throttledScroll.cancel();
        this.#debouncedScrollEnd.cancel();
    }

    handleContainerChange = () => {
        if (this.#getContainer() !== this.#container) {
            this.#unbind();
            this.#bind();
        }
    };

    // Called after every commit, since links above the active one can move it unnoticed; an unchanged position sets no
    // state, so the call cannot re-render in a loop.
    syncSlideBar = () => {
        const linkNode = this.adapter.getRoot()?.querySelector<HTMLElement>(`.${cssClasses.LINK_TITLE_ACTIVE}`);
        if (linkNode && linkNode.offsetTop !== this.#slideBarTop) {
            this.#slideBarTop = linkNode.offsetTop;
            this.setState({ slideBarTop: `${this.#slideBarTop}px` });
        }
    };

    /** For hosts that know their links up front, instead of addLink and removeLink */
    setLinks = (links: string[]) => {
        this.setState({ links });
    };

    /** `parent` is the href of the link this one is nested in */
    addLink = (link: string, parent?: string) => {
        const linkParents = this.getState('linkParents');
        this.setState({ links: [...this.getState('links'), link], linkParents: parent ? { ...linkParents, [link]: parent } : linkParents }, () => this.#rescanAfterCommit());
    };

    removeLink = (link: string) => {
        const links = this.getState('links');
        const index = links.indexOf(link);
        if (index !== -1) {
            const rest = links.toSpliced(index, 1);
            const linkParents = this.getState('linkParents');
            // another link with the same href may still be mounted
            const nextParents = rest.includes(link) ? linkParents : Object.fromEntries(Object.entries(linkParents).filter(([href]) => href !== link));
            this.setState({ links: rest, linkParents: nextParents }, () => this.#rescanAfterCommit());
        }
    };

    handleClick = (e: E, link: string) => {
        this.#goToLink(link, true);
        this.adapter.notifyClick(e, link);
    };
}
