import React from 'react'
import { NotionRenderer } from 'react-notion'

import 'react-notion/src/styles.css'
import 'prismjs/themes/prism-tomorrow.css'

import data from './data.json'

const NotionPage = () => (
    <NotionRenderer
      blockMap={data}
    />
)

export default NotionPage
