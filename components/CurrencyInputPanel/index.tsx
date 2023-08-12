import React, { useState, useCallback } from 'react'
import { Currency, Pair } from '@pancakeswap-libs/sdk'
import { Button, ChevronDownIcon, Text } from '@pancakeswap-libs/uikit'
import styled from 'styled-components'
import { darken } from 'polished'
import { useCurrencyBalance } from '@/state/wallet/hooks'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import TokenModal from '../TokenSelectModal/TokenModal'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween } from '../Row'
import { Input as NumericalInput } from '../NumericalInput'
import { useActiveWeb3React } from '@/hooks'

const InputRow = styled.div<{ selected: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`
const CurrencySelect = styled.button<{ selected: boolean }>`
  align-items: center;
  height: 34px;
  font-size: 16px;
  font-weight: 500;
  background-color: transparent;
  color: ${({ selected, theme }) => (selected ? theme.colors.text : '#FFFFFF')};
  border-radius: 12px;
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  padding: 0 0.5rem;
  :focus,
`
const LabelRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.colors.textSubtle)};
  }
`
const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(144, 224, 64, 0.5);
  border-radius: 8px;
  padding: 6px;
`
const InputPanel = styled.div<{ hideInput?: boolean }>`
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  background: #F6F6F7;
  border-radius: 8px;
  z-index: 1;
`
const Container = styled.div<{ hideInput: boolean }>`
  border-radius: 16px;
`
interface CurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: string
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
}
export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label,
  onCurrencySelect,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  otherCurrency,
  id,
  showCommonBases,
}: CurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const translatedLabel = label || 'Input'
  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])
  return (
    <>
      <InputPanel id={id}>
        <Container hideInput={hideInput}>
          {!hideInput && (
            <LabelRow>
              <div className='w-full flex justify-end'>
                {/* <Text fontSize="14px">{translatedLabel}</Text> */}
                {account && (
                  <Text onClick={onMax} style={{ display: 'inline', cursor: 'pointer', color: "#242424" }}>
                    {!hideBalance && !!currency && selectedCurrencyBalance
                      ? `Balance: ${selectedCurrencyBalance?.toSignificant(6)}`
                      : ' -'}
                  </Text>
                )}
              </div>
            </LabelRow>
          )}
          <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={disableCurrencySelect}>
            {!hideInput && (
              <>
                <NumericalInput
                  className="token-amount-input"
                  value={value}
                  onUserInput={(val) => {
                    onUserInput(val)
                  }}
                />
                {account && currency && showMaxButton && label !== 'To' && (
                  <Button onClick={onMax} scale="sm" variant="text">
                    MAX
                  </Button>
                )}
              </>
            )}
            <div className='flex flex-col justify-between items-end'>
              <CurrencySelect
                selected={!!currency}
                className="open-currency-select-button"
                onClick={() => {
                  if (!disableCurrencySelect) {
                    setModalOpen(true)
                  }
                }}
              >
                <Aligner>
                  {pair ? (
                    <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={16} margin />
                  ) : currency ? (
                    <CurrencyLogo currency={currency} size="24px" style={{ marginRight: '8px' }} />
                  ) : null}
                  {pair ? (
                    <Text id="pair" color='#242424;'>
                      {pair?.token0.symbol}:{pair?.token1.symbol}
                    </Text>
                  ) : (
                    <Text id="pair" style={{ color: "#242424" }}>
                      {(currency && currency.symbol && currency.symbol.length > 20
                        ? `${currency.symbol.slice(0, 4)}...${currency.symbol.slice(
                          currency.symbol.length - 5,
                          currency.symbol.length
                        )}`
                        : currency?.symbol) || 'Select a currency'}
                    </Text>
                  )}
                  {!disableCurrencySelect && <ChevronDownIcon />}
                </Aligner>
              </CurrencySelect>
            </div>
          </InputRow>
        </Container>
      </InputPanel>
      {!disableCurrencySelect && onCurrencySelect && modalOpen && (
        <TokenModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
        />
      )}
    </>
  )
}
