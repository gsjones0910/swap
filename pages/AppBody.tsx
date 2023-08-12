import React from 'react'
import styled from 'styled-components'
import { Card } from '@pancakeswap-libs/uikit'

export const BodyWrapper = styled(Card)`
  position: relative;
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 1rem; /* 16px */
  padding-top: 40px;
  padding-bottom: 40px;
  margin-top: 1px;
  margin-top: 30px;
  margin-bottom: 30px;
  color: #242424;
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children }: { children: React.ReactNode }) {
  return <BodyWrapper className='sm:w-[640px] sm:max-w-[640px] max-w-[460px] w-full'>{children}</BodyWrapper>
}
