import Link from 'next/link'

const linkClasses = 'no-underline hover:underline hover:decoration-1'

const AnchorLink = ({ id, txt = false, children }) => (
  <a href={`#${id}`} className={linkClasses} title={txt ? txt : ''}>
    {txt ? txt : children}
  </a>
)

const PageLink = ({ href, txt = false, children }) => (
  <Link href={href} className={linkClasses} title={txt ? txt : ''}>
    {children ? children : txt}
  </Link>
)

const WebLink = ({ href, txt = false, children }) => (
  <a href={href} className={linkClasses} title={txt ? txt : ''}>
    {children ? children : txt}
  </a>
)

export { linkClasses, Link, AnchorLink, PageLink, WebLink }
