import React from 'react'
import { Text } from '@pancakeswap-libs/uikit'
import styled from 'styled-components'
import { RowFixed } from '../Row'
import BtnArrowDown from '../../assets/btn-arrow-down.svg'

export const FilterWrapper = styled(RowFixed)`
  padding: 4px;
  color: ${({ theme }) => theme.colors.text};
  border-radius: 8px;
  user-select: none;
  & > * {
    user-select: none;
  }
  :hover {
    cursor: pointer;
  }
`

export default function SortButton({
  toggleSortOrder,
  ascending
}: {
  toggleSortOrder: () => void
  ascending: boolean
}) {
  return (
    <FilterWrapper onClick={toggleSortOrder}>
      <div className='rounded-full'>{ascending ? <BtnArrowDown className="rotate-180 w-8 h-8" /> : <BtnArrowDown />}</div>
    </FilterWrapper>
  )
}
