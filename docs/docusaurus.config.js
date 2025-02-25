// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config
import { themes as prismThemes } from 'prism-react-renderer'
import smartyPants from 'remark-smartypants'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

/** @type {import('@docusaurus/types').Config} */
const config = {
  // Metadata
  title: 'Morio',
  tagline: 'Plumbing for your observability needs',
  favicon: 'img/favicon.svg',
  url: 'https://morio.it',
  baseUrl: '/',

  // Github pages
  organizationName: 'certeu',
  projectName: 'morio',

  // How to handle broken links
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // i18n
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          remarkPlugins: [smartyPants],
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/certeu/morio/tree/develop/docs/',
        },
        blog: {
          showReadingTime: true,
          onInlineAuthors: 'throw',
          //onUntruncatedBlogPost: 'throw',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/certeu/morio/tree/develop/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
    // Redocusaurus config
    [
      'redocusaurus',
      {
        // Plugin Options for loading OpenAPI files
        specs: [
          // Management API docs from OpenAPI spec
          {
            spec: './static/oas-api.yaml',
            route: '/docs/reference/apis/api/',
          },
          // Core API docs from OpenAPI spec
          {
            spec: './static/oas-core.yaml',
            route: '/docs/reference/apis/core/',
          },
        ],
        // Theme Options for modifying how redoc renders them
        theme: {
          // Change with your site colors
          primaryColor: '#1890ff',
        },
      },
    ],
  ],

  plugins: [
    async function tailwindPlugin() {
      return {
        name: 'docusaurus-tailwindcss',
        configurePostCss(postcssOptions) {
          // Appends TailwindCSS and AutoPrefixer.
          postcssOptions.plugins.push(tailwindcss)
          postcssOptions.plugins.push(autoprefixer)
          return postcssOptions
        },
      }
    },
  ],

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [
        { name: 'title', content: 'Morio: Observability Plumbing' },
        {
          name: 'keywords',
          content: 'observability, cybersecurity, streaming data, stream processing',
        },
      ],
      image: 'img/morio-social-card.png',
      announcementBar: {
        content:
          'Morio is not ready for production | <a href="/blog/2024/06/26/oven-window">Learn more</a>',
        isCloseable: false,
        backgroundColor: '#EB6534',
        textColor: '#fff',
      },
      navbar: {
        title: 'Morio',
        logo: {
          alt: 'Morio Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'guides/readme',
            position: 'left',
            label: 'Guides',
          },
          {
            type: 'doc',
            docId: 'reference/readme',
            position: 'left',
            label: 'Reference',
          },
          {
            type: 'doc',
            docId: 'training/readme',
            position: 'left',
            label: 'Training',
          },
          { to: '/blog', label: 'Blog', position: 'left' },
          { to: '/hub', label: 'MorioHub', position: 'right' },
          {
            href: 'https://github.com/certeu/morio',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        links: [],
        copyright: `
        <div id="tagline">
        <a href="/"><b>Morio</b></a>
        <br />
        <span>Connect | Stream | Observe | Respond</span>
        By <a href="https://cert.europa.eu/" target="_BLANK" rel="nofollow">CERT-EU</a>
        </div>`,
      },
      prism: {
        theme: prismThemes.dracla,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['yaml'],
      },
      algolia: {
        appId: 'UZ39NUY47C',
        apiKey: 'f502f6d4701c9fbc8b735157198fbc0f',
        indexName: 'morio',
        contextualSearch: true,
        searchParameters: {},
        searchPagePath: 'search',
        insights: false,
      },
    }),
}

export default config
