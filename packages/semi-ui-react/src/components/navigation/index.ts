import Footer from './footer';
import Header from './header';
import Item from './item';
import Nav from './nav';
import SubNav from './sub-nav';

export default Object.assign(Nav, { Sub: SubNav, Item, Header, Footer });
export type * from './nav';
