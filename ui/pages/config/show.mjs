import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Tab, Tabs } from 'components/tabs.mjs'
import { Popout } from 'components/popout.mjs'

const ConfigPage = (props) => {
  const { api } = useApi()
  const [config, setConfig] = useState(null)

  useEffect(() => {
    const loadConfig = async () => {
      const [content] = await api.getCurrentConfig()
      setConfig(content)
    }
    if (!config) loadConfig()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  const base = config ? JSON.parse(JSON.stringify(config)) : null
  if (base) {
    delete base.services
    delete base.deployment.key_pair
  }

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props}>
        <div className="max-w-4xl">
          {config ? (
            <Tabs tabs="Base, Services, Full">
              <Tab tabId="Base">
                <div className="max-w-prose m-auto">
                  <Popout tip>
                    <h4>This is the Morio base configuration</h4>
                    <p>
                      It holds the high-level settings of this Morio deployment, and can be used to
                      setup a similar (but not identical) Morio instance.
                    </p>
                  </Popout>
                </div>
                <Highlight js={base} title="Morio Base Configuration" />
              </Tab>
              <Tab tabId="Services">
                <div className="max-w-prose m-auto">
                  <Popout note>
                    <h4>This are the Morio service configurations</h4>
                    <p>
                      They are auto-generated by Morio core, based on the base configuration, the
                      presets, and the environment variables.
                    </p>
                  </Popout>
                </div>
                <Tabs tabs={Object.keys(config.services)}>
                  {Object.keys(config.services).map((srv) => (
                    <Tab tabId={srv}>
                      <Highlight
                        js={config.services[srv]}
                        title={`${srv.toUpperCase()} Configuration`}
                      />
                    </Tab>
                  ))}
                </Tabs>
              </Tab>
              <Tab tabId="Base">
                <div className="max-w-prose m-auto">
                  <Popout note>
                    <h4>
                      This is <code>mConf</code>, the full high-level Morio configuration
                    </h4>
                    <p>
                      Most of this is auto-generated and closely tied to this deployment. It is
                      provided for debugging and insights into the inner Morio workings.
                    </p>
                  </Popout>
                </div>
                <Highlight js={config} title="Morio full mConf" />
              </Tab>
            </Tabs>
          ) : null}
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ConfigPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Configuration',
    page: ['config'],
  },
})
