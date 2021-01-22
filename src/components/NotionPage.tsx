import React from 'react'
import { NotionRenderer, BlockMapType } from 'react-notion'

import '../styles/notion.css'
import 'prismjs/themes/prism-tomorrow.css'

export default function NotionPage ({ data }: { data: BlockMapType }) {
  return (
    <NotionRenderer
      blockMap={data}
    />
  )
}
