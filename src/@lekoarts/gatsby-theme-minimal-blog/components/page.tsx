/** @jsx jsx */
import { jsx, Heading } from 'theme-ui'
import { MDXRenderer } from 'gatsby-plugin-mdx'

import Layout from '@lekoarts/gatsby-theme-minimal-blog/src/components/layout'
import SEO from '@lekoarts/gatsby-theme-minimal-blog/src/components/seo'

type PageProps = {
  data: {
    page: {
      title: string
      slug: string
      excerpt: string
      body: string
    }
  }
  [key: string]: any
}

const Page = ({ data: { page } }: PageProps) => (
  <Layout>
    <SEO title={page.title} description={page.excerpt} />
    <div sx={{ textAlign: 'center' }}>
      <Heading as="h1" variant="styles.h1">
        {page.title}
      </Heading>
    </div>
    <section sx={{ my: 4, variant: 'layout.content' }}>
      <MDXRenderer>{page.body}</MDXRenderer>
    </section>
  </Layout>
)

export default Page
