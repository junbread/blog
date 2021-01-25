/** @jsx jsx */
import React from 'react'
import { jsx, Link as TLink } from 'theme-ui'
import { Box } from '@theme-ui/components'
import { Link } from 'gatsby'
import ItemTags from '@lekoarts/gatsby-theme-minimal-blog/src/components/item-tags'

import useMinimalBlogConfig from '../hooks/use-minimal-blog-config'
import replaceSlashes from '@lekoarts/gatsby-theme-minimal-blog/src/utils/replaceSlashes'

type BlogListItemProps = {
  post: {
    slug: string
    title: string
    date: string
    excerpt: string
    description: string
    timeToRead?: number
    tags?: {
      name: string
      slug: string
    }[]
  }
  showTags?: boolean
}

const BlogListItem = ({ post, showTags = true }: BlogListItemProps) => {
  const { postsPrefix } = useMinimalBlogConfig()

  return (
    <Box mb={4}>
      <p sx={{ color: 'secondary', mb: 0, a: { color: 'secondary' }, fontSize: [1, 1, 1] }}>
        <time>{post.date}</time>
      </p>
      {post.tags && showTags && (
        <div>
          <React.Fragment>
            <ItemTags tags={post.tags} />
          </React.Fragment>
        </div>
      )}
      <TLink as={Link} to={replaceSlashes(`/${postsPrefix}/${post.slug}`)} sx={{ fontSize: [1, 2, 3], color: 'text', fontWeight: 'bold' }}>
        {post.title}
      </TLink>
      <p sx={{ fontSize: [1, 2, 2], mt: 1, color: '#666666cc' }}>
        {post.description ? post.description : post.excerpt}
      </p>
    </Box>
  )
}

export default BlogListItem
