import ReactDOMServer from 'react-dom/server'
import { useState, useContext } from 'react'
import { CopyIcon, OkIcon } from 'components/icons.mjs'
import { CopyToClipboard as Copy } from 'react-copy-to-clipboard'
import { LoadingStatusContext } from 'context/loading-status.mjs'

const strip = (html) =>
  typeof DOMParser === 'undefined'
    ? html
    : new DOMParser().parseFromString(html, 'text/html').body.textContent || ''

const handleCopied = (setCopied, setLoadingStatus, label) => {
  setCopied(true)
  setLoadingStatus([
    true,
    label ? `${label} copied to clipboard` : 'Copied to clipboard',
    true,
    true,
  ])
  setTimeout(() => setCopied(false), 1000)
}

export const CopyToClipboard = ({ content, label = false, sup = false }) => {
  const [copied, setCopied] = useState(false)
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  const text =
    typeof content === 'string' ? content : strip(ReactDOMServer.renderToStaticMarkup(content))

  const style = sup ? 'w-4 h-4 -mt-4' : 'w-5 h-5'

  return (
    <Copy text={text} onCopy={() => handleCopied(setCopied, setLoadingStatus, label)}>
      <button className={copied ? 'text-success' : ''}>
        {copied ? (
          <OkIcon
            className={`${style} text-success-content bg-success rounded-full p-1`}
            stroke={4}
          />
        ) : (
          <CopyIcon className={`${style} text-inherit hover:text-primary`} />
        )}
      </button>
    </Copy>
  )
}
