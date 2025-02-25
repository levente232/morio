import React from 'react'
import MDXComponents from '@theme-original/MDXComponents'
// Custom Morio scope
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import { SubPages } from './components/subpages.js'
import { Architecture } from './components/mermaid.js'
import { Term } from './components/term.js'
import { RepoFile } from './components/repofile.js'
import { Label } from './components/label.js'

/*
 * This seems to simple to put in a file on its own
 */
const WithCaption = ({ children, caption }) => (
  <div className="with-caption">
    <div className="shadow">{children}</div>
    <p className="caption">{caption}</p>
  </div>
)

export default {
  ...MDXComponents,
  // Custom Morio scope
  Architecture,
  Label,
  RepoFile,
  SubPages,
  WithCaption,
  // Jargon
  em: (props) => <Term {...props} />,
  Tabs,
  TabItem,
}
