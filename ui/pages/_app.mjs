import 'ui/styles/globals.css'
import { ModalContextProvider } from 'context/modal.mjs'
import { LoadingStatusContextProvider } from 'context/loading-status.mjs'
import { CookiesProvider } from 'react-cookie'
import { MDXWrapper } from 'components/layout/mdx-wrapper.mjs'
import { ReadMore } from 'components/read-more.mjs'
import { links } from 'components/navigation/main-menu.mjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/*
 * Create the query client
 */
const queryClient = new QueryClient()

/*
 * We need to wrap the ReadMore component so it knows what page
 * it was called from
 */
const WrappedReadMore = (props) => <ReadMore {...props} />

export default function App({ Component, pageProps }) {
  return (
    <ModalContextProvider>
      <LoadingStatusContextProvider>
        <CookiesProvider defaultSetOptions={{ path: '/' }}>
          <QueryClientProvider client={queryClient}>
            {Component.isMDXComponent ? (
              <MDXWrapper pageProps={pageProps} filePath={pageProps.filepath}>
                <Component
                  {...pageProps}
                  components={{
                    ReadMore: (props) =>
                      WrappedReadMore({ filepath: pageProps.filepath, links, ...props }),
                  }}
                />
              </MDXWrapper>
            ) : (
              <Component {...pageProps} />
            )}
          </QueryClientProvider>
        </CookiesProvider>
      </LoadingStatusContextProvider>
    </ModalContextProvider>
  )
}
