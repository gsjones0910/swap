import React from 'react'
import styled from 'styled-components'
import Link from 'next/link'
import { ArrowLeft } from 'react-feather'
import { RowBetween } from '@/components/Row'
import QuestionHelper from '@/components/QuestionHelper'
import BtnArrow from '../../assets/btn-arrow.svg'

const Tabs = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  border-radius: 3rem;
  justify-content: space-evenly;
`

const ActiveText = styled.div`
  font-weight: 700;
  font-size: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  color: #242424;
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.colors.text};
`

export function FindPoolTabs() {
  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem' }}>
        <Link href="/liquidity">
          <StyledArrowLeft />
        </Link>
        <ActiveText>Import Pool</ActiveText>
        <QuestionHelper
          text={'Use this tool to find pairs that do not automatically appear in the interface.'}
        />
      </RowBetween>
    </Tabs>
  )
}

export function AddRemoveTabs({ adding }: { adding: boolean }) {
  return (
    <Tabs>
      <RowBetween style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        <Link href="/liquidity">
          <div className="absolute w-10 h-10 flex justify-center items-center left-5 rounded-full bg-[#F6F6F7] cursor-pointer">
            <BtnArrow />
          </div>
        </Link>
        <ActiveText>{adding ? 'ADD' : 'REMOVE'} LIQUIDITY</ActiveText>
        {/* <QuestionHelper
          text={
            adding
              ?
              'When you add liquidity, you are given pool tokens representing your position. These tokens automatically earn fees proportional to your share of the pool, and can be redeemed at any time.'
              :
              'Removing pool tokens converts your position back into underlying tokens at the current rate, proportional to your share of the pool. Accrued fees are included in the amounts you receive.'
          }
        /> */}
      </RowBetween>
    </Tabs>
  )
}
