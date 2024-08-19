import matter from 'gray-matter'
import path from 'node:path'
import yaml from 'js-yaml'
// OpenAPI specifications
import { spec as apiSpec } from '../api/openapi/index.mjs'
import { spec as coreSpec } from '../core/openapi/index.mjs'
// Utils
import { globDir, readDirectory, writeFile, readFile } from '../shared/src/fs.mjs'

/*
 * Helper method to write out OpenAPI specification files
 */
const writeOpenAPISpecs = async () => {
  for (const [name, spec] of Object.entries({
    api: apiSpec,
    core: coreSpec,
  }))
    await writeFile(`./static/oas-${name}.yaml`, yaml.dump(spec))
}

/*
 * Shared header to include in written .mjs files
 */
export const header = `/*
 *  This file was auto-generated by the prebuild script
 *  Any changes you make to it will be lost on the next (pre)build.
 */
`

/*
 * Ensure key can be used in an import statement
 */
const toImportKey = (key) => key.split('-').join('DASH').split(' ').join('SPACE')

/*
 * Helper method to generate the jargon imports umbrella file
 */
const ensureJargonImports = async () => {
  const data = []
  const imports = []
  const root = path.resolve('./jargon')
  const pages = (await globDir(root, '*.md')).map((page) => page.split(`${root}/`).pop())
  for (const page of pages) {
    const md = await readFile(path.resolve(`./jargon/${page}`))
    const fm = matter(md)
    const key = page.split('.md')[0]
    const ikey = toImportKey(key)
    imports.push(`import ${ikey}, { frontMatter as ${ikey}Fm } from '@site/jargon/${key}.md'`)
    data.push(
      `  "${fm.data?.term ? fm.data.term.toLowerCase() : key.toLowerCase()}": {` +
      `title: "${fm.data?.title ? fm.data.title : key.toUpperCase()}", ` +
      `aliases: ${fm.data?.aliases ? JSON.stringify(fm.data.aliases) : '[]'}, ` +
      `content: ${ikey} }`
    )
  }

  await writeFile(
    path.resolve('./prebuild/jargon.js'),
    header + imports.join("\n") + "\n\n" + 'export default {' + "\n" + data.join(",\n") + "\n}\n"
  )
}

/*
 * Helper method to generate the terminology imports umbrella file
 */
const ensureTerminologyImports = async () => {
  const data = []
  const imports = []
  const root = path.resolve('./docs/reference/terminology')
  const pages = (await readDirectory(root)).filter(dir => dir !== "readme.md").map((page) => page.split(`${root}/`).pop())
  for (const page of pages) {
    const file = path.resolve(`./docs/reference/terminology/${page}/readme.md`)
    const md = await readFile(file)
    const fm = matter(md)
    const key = page
    const ikey = toImportKey(key)
    imports.push(`import { frontMatter as ${ikey} } from '@site/docs/reference/terminology/${key}/readme.md'`)
    data.push(
      `  "${key.split('-').join(' ').toLowerCase()}": { ` +
      `title: "${fm.data.title ? fm.data.title : key}", ` +
      `term: "${fm.data.term ? fm.data.term.toLowerCase() : fm.data.title.toLowerCase()}", ` +
      `aliases: ${fm.data.aliases ? JSON.stringify(fm.data.aliases) : '[]'}, ` +
      `url: "/docs/reference/terminology/${key}" }`
    )
  }

  await writeFile(
    path.resolve('./prebuild/terminology.js'),
    header + imports.join("\n") + "\n\n" + 'export default {' + "\n" + data.join(",\n") + "\n}\n"
  )
}


/*
 * Main method that does what needs doing for the docs
 */
export const prebuildDocs = async () => {
  /*
   * OpenAPI specs
   */
  await writeOpenAPISpecs()

  /*
   * Jargon imports
   */
  await ensureJargonImports()

  /*
   * Terminology imports
   */
  await ensureTerminologyImports()

}

prebuildDocs()
