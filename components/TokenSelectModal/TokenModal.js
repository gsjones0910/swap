/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useCallback } from 'react';
import { useMoralis } from "react-moralis";
import Cross from '@/assets/cross.svg';
import { Modal } from "antd"
import { ListSelect } from '../SearchModal/ListSelect'
import { CurrencySearch } from '../SearchModal/CurrencySearch'
import useLast from '@/hooks/useLast'
import { useSelectedListUrl } from '@/state/lists/hooks'
import { ExclamationCircleOutlined } from "@ant-design/icons"
 
export default function TokenModal({ isOpen, onDismiss, onCurrencySelect, selectedCurrency, otherSelectedCurrency, showCommonBases }) {
  const [listView, setListView] = useState(false)
  const lastOpen = useLast(isOpen)

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setListView(false)
    }
  }, [isOpen, lastOpen])

  const handleCurrencySelect = useCallback(
    (currency) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  const handleClickChangeList = useCallback(() => {
    setListView(true)
  }, [])
  const handleClickBack = useCallback(() => {
    setListView(false)
  }, [])

  const selectedListUrl = useSelectedListUrl()
  const noListSelected = !selectedListUrl
  return (
    
    <div className="fixed w-screen h-screen bg-[#242424] top-0 left-0 bg-opacity-50 flex justify-end z-20">
      <button
        className="hidden md:flex w-10 h-10 bg-[#f2f3f5] rounded-full justify-center items-center mr-8 mt-20"
        onClick={onDismiss}
      >
        <Cross className="w-5 h-5 stroke-[#242424]" />
      </button>
      <div className="max-w-2xl w-full h-screen bg-[#F2F3F5] opacity-100 shrink-0 pt-10 md:pt-20 px-10 overflow-y-auto">
        <button
          className="flex md:hidden w-10 h-10 ml-auto bg-[#f2f3f5] rounded-full justify-center items-center mb-8"
          onClick={onDismiss}
        >
          <Cross className="w-5 h-5 stroke-[#242424]" />
        </button>

        <div className="flex items-end justify-between mb-8">
          <h2 className="text-5xl font-bold uppercase">Select a token</h2>
        </div>
        {listView ? (
        <ListSelect onDismiss={onDismiss} onBack={handleClickBack} />
        ) : noListSelected ? (
          <CurrencySearch
            isOpen={isOpen}
            onDismiss={onDismiss}
            onCurrencySelect={handleCurrencySelect}
            onChangeList={handleClickChangeList}
            selectedCurrency={selectedCurrency}
            otherSelectedCurrency={otherSelectedCurrency}
            showCommonBases={false}
          />
        ) : (
          <CurrencySearch
            isOpen={isOpen}
            onDismiss={onDismiss}
            onCurrencySelect={handleCurrencySelect}
            onChangeList={handleClickChangeList}
            selectedCurrency={selectedCurrency}
            otherSelectedCurrency={otherSelectedCurrency}
            showCommonBases={false}
          />
        )}
      </div>
    </div>
  )
}