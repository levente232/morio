// Dependencies
import { cloneAsPojo, timeAgo, parseJson } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
import { chartTemplates } from './chart-templates.mjs'
// Hooks
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
// Components
import Link from 'next/link'
import { RightIcon, NoIcon, OkIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { Loading, Spinner } from 'components/animations.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { ListInput } from 'components/inputs.mjs'
import { Highlight } from 'components/highlight.mjs'
import { ToggleGraphButton, ToggleLiveButton } from 'components/boards/shared.mjs'
import { SingleEchart } from './metrics.mjs'
import { chartGradient } from 'components/echarts.mjs'
import { Popout } from 'components/popout.mjs'

/**
 * This component renders a table with the host for which we have cached logs
 */
export const ChecksTable = () => {
  // State
  const [cache, setCache] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)
  const [show, setShow] = useState('all')

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runChecksTableApiCall(api, 'checks').then((result) => {
      if (result) {
        const all = []
        for (const check of result) {
          const chunks = check.split('|')
          all.push({ key: check, id: chunks[1] })
        }
        setCache(all)
      }
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Tell people  we are still lading
  if (cache === false)
    return (
      <>
        <Loading />
        <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
      </>
    )

  // Don't bother if there's nothing in the cache
  if (cache.length < 1)
    return (
      <Popout note>
        <h5>No health check data found</h5>
        <p>No health check data was returned from the cache.</p>
        <p>
          If this is unexpected, you should verify that you are running a stream processor that
          caches health check data.
        </p>
      </Popout>
    )

  const btn = (
    <ListInput
      label="Display:"
      current={show}
      list={[
        {
          label: 'All health checks',
          val: 'all',
        },
        {
          label: 'Failing health checks',
          val: 'failing',
        },
        {
          label: 'List of health check IDs',
          val: 'list',
        },
      ]}
      dense={true}
      dir="row"
      update={(val) => setShow(val)}
    />
  )

  if (show !== 'list')
    return (
      <>
        {btn}
        <div className="flex flex-row flex-wrap items-center gap-2">
          {cache.map((check) => (
            <UpOrNot key={check.key} cacheKey={check.key} hideOnUp={show === 'failing'} />
          ))}
        </div>
      </>
    )

  // Only keep what is in the cache, but use the inventory data
  const sorted = orderBy(cache, [order], [desc ? 'desc' : 'asc'])

  return (
    <>
      {btn}
      <table className="table table-auto">
        <thead>
          <tr>
            {['id'].map((field) => (
              <th key={field}>
                <button
                  className="btn btn-link capitalize px-0 underline hover:decoration-4 decoration-2"
                  onClick={() => (order === field ? setDesc(!desc) : setOrder(field))}
                >
                  {field}{' '}
                  <RightIcon
                    stroke={3}
                    className={`w-4 h-4 ${desc ? '-' : ''}rotate-90 ${order === field ? '' : 'opacity-0'}`}
                  />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((check) => (
            <tr key={check.id}>
              <td className="">
                <PageLink href={`/boards/checks/${check.id}`}>{check.id}</PageLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runChecksTableApiCall(api, key) {
  const result = await api.getCacheKey(key)
  if (Array.isArray(result) && result[1] === 200) return result[0].value

  return false
}

export const UpOrNot = ({ cacheKey, hideOnUp = false }) => {
  // State
  const [cache, setCache] = useState(false)

  // Hooks
  const { api } = useApi()
  const { isLoading } = useQuery({
    queryKey: [cacheKey],
    queryFn: () => {
      runCheckApiCall(api, cacheKey).then((result) => {
        if (result) setCache(result)
      })
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  })

  const check = Array.isArray(cache) && cache.length > 0 ? JSON.parse(cache.pop()) : false

  if (isLoading)
    return (
      <div className={`bg-neutral opacity-60 rounded-lg shadow p-1 w-10 h-10`}>
        <Spinner />
      </div>
    )

  // Hide up if requested
  if (hideOnUp && check.up) return null

  return (
    <Link
      className={`bg-${check.up ? 'success' : 'error'} rounded-lg shadow p-1 w-10 h-10 overflow-clip`}
      title={`${check.name} (${check.id})`}
      href={`/boards/checks/${check.id}`}
    >
      {check.up ? (
        <OkIcon className="w-8 h-9 text-success-content" stroke={4} />
      ) : (
        <NoIcon className="w-8 h-8 text-error-content" stroke={4} />
      )}
    </Link>
  )
}

async function runCheckApiCall(api, key) {
  const result = await api.getCacheKey(key)
  if (Array.isArray(result) && result[1] === 200) return result[0].value

  return false
}

export const Check = ({ id = false, cacheKey = false }) => {
  if (!cacheKey && id) cacheKey = `check|${id}`

  // State
  const [graph, setGraph] = useState(true)
  const [cache, setCache] = useState(false)
  const [paused, setPaused] = useState(false)

  // Hooks
  const { api } = useApi()
  useQuery({
    queryKey: [cacheKey],
    queryFn: () => {
      runCheckApiCall(api, cacheKey).then((result) => {
        if (result) setCache(result)
      })
    },
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })

  if (!cacheKey) return null
  if (!Array.isArray(cache)) return <Spinner />

  const data = parseCachedHealthchecks(cache)
  const templates = cloneAsPojo(chartTemplates)

  const option = templates.charts.line
  option.title.text = 'Health check response time'
  option.yAxis.name = 'Response time in ms'
  /*
   * Split series by agent
   */
  option.series = {}
  for (const check of data) {
    if (typeof option.series[check.from] === 'undefined') {
      option.series[check.from] = {
        ...templates.series.line,
        data: [],
        name: `Response time from ${check.from}`,
      }
    }
    option.series[check.from].data.push(check.ms)
  }
  option.series = Object.values(option.series)
  if (option.series.length === 1) {
    option.series[0].areaStyle = {
      opacity: 0.2,
      color: chartGradient('#1b88a2'),
    }
  }
  const check = data.pop()

  return (
    <div className="">
      <h5 className="text-center">{check.name}</h5>
      <div className="flex flex-row items-center justify-center gap-2 mb-1">
        <ToggleLiveButton {...{ paused, setPaused }} />
        <KeyVal k="status" val={check.up ? 'up' : 'down'} color={check.up ? 'success' : 'error'} />
        <KeyVal k="uptime" val={`${Math.round(check.uptime * 1000) / 10}%`} />
        <KeyVal k="since" val={timeAgo(check.uptime_since)} />
        <ToggleGraphButton {...{ graph, setGraph }} />
      </div>
      <div className="flex flex-row items-center justify-center gap-2 mb-2">
        <KeyVal k="url" val={check.url} small />
        <KeyVal k="id" val={check.id} small />
      </div>
      {graph ? (
        <SingleEchart option={option} />
      ) : (
        <Highlight language="json">{JSON.stringify(data, null, 2)}</Highlight>
      )}
    </div>
  )
}

function parseCachedHealthchecks(data) {
  if (Array.isArray(data))
    return orderBy(
      data.map((entry) => parseJson(entry)).map((entry) => ({ ...entry, timestamp: entry.time })),
      'timestamp',
      'ASC'
    )

  console.log('Health check data was a not an array. This is unexpected')
  return []
}
