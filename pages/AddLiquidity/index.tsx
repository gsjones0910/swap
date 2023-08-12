import React, { useCallback, useEffect, useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, currencyEquals, ETHER, TokenAmount, WETH } from '@pancakeswap-libs/sdk'
import { Button, CardBody, AddIcon, Text as UIKitText } from '@pancakeswap-libs/uikit'
import styled from 'styled-components'
import { LightCard } from '@/components/Card'
import { AutoColumn, ColumnCenter } from '@/components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '@/components/TransactionConfirmationModal'

import CurrencyInputPanel from '@/components/CurrencyInputPanel'
import DoubleCurrencyLogo from '@/components/DoubleLogo'
import { AddRemoveTabs } from '@/components/NavigationTabs'
import Link from 'next/link'
import Row, { RowBetween, RowFlat } from '@/components/Row'

import { PairState } from '../../data/Reserves'
import { useActiveWeb3React } from '@/hooks'
import { useCurrency } from '@/hooks/Tokens'
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback'
import { Field } from '@/state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '@/state/mint/hooks'

import { useTransactionAdder } from '@/state/transactions/hooks'
import { useIsExpertMode, useUserDeadline, useUserSlippageTolerance } from '@/state/user/hooks'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '@/utils'
import { maxAmountSpend } from '@/utils/maxAmountSpend'
import { wrappedCurrency } from '@/utils/wrappedCurrency'
import { currencyId } from '@/utils/currencyId'
import Pane from '@/components/Pane'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import Notification from '@/components/Notification'
import AppBody from '../AppBody'
import { ConfirmAddModalBottom } from './ConfirmAddModalBottom'
import { PoolPriceBar } from './PoolPriceBar'
import { ROUTER_ADDRESS } from '../../constants'
import { useRouter } from 'next/router'

import { useMoralis } from "react-moralis";

import { Scrolling } from "../../components/Scrolling";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Preloader from "../../components/Preloader/Preloader";
import { MinimalPositionCard } from '@/components/PositionCard'
import ViewScan from '../../assets/viewscan.svg'
import RateSetModal from "@/components/RateSetModal";

const Dots = styled.span`
  &::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: '.';
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
`
const Wrapper = styled.div`
  position: relative;
`

export default function AddLiquidity({ currencyIdA, currencyIdB }: { currencyIdA?: string; currencyIdB?: string }) {


  const { account, chainId, library } = useActiveWeb3React()
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const history = useRouter()
  const oneCurrencyIsWBNB = Boolean(
    chainId &&
    ((currencyA && currencyEquals(currencyA, WETH[chainId])) ||
      (currencyB && currencyEquals(currencyB, WETH[chainId])))
  )
  const expertMode = useIsExpertMode()

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error,
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const [deadline] = useUserDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')
  const [show, setShow] = useState(true);
  const [eventsModalOpen, setEventsModalOpen] = useState(false);

  const eventsModalOpenHandler = () => {
    setEventsModalOpen(true);
  }

  const eventsModalCloseHandler = () => {
    setEventsModalOpen(false);
  }
  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {}
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], ROUTER_ADDRESS)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], ROUTER_ADDRESS)

  const addTransaction = useTransactionAdder()

  useEffect(() => {
    if (approvalA === ApprovalState.APPROVED || approvalB === ApprovalState.APPROVED)
      setShow(true);
  }, [approvalA, approvalB])

  async function onAdd() {
    if (!chainId || !library || !account) return
    const router = getRouterContract(chainId, library, account)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0],
    }

    const deadlineFromNow = Math.ceil(Date.now() / 1000) + deadline

    let estimate
    let method: (...args: any) => Promise<TransactionResponse>
    let args: Array<string | string[] | number>
    let value: BigNumber | null
    if (currencyA === ETHER || currencyB === ETHER) {
      const tokenBIsBNB = currencyB === ETHER
      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH
      args = [
        wrappedCurrency(tokenBIsBNB ? currencyA : currencyB, chainId)?.address ?? '', // token
        (tokenBIsBNB ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsBNB ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsBNB ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        account,
        deadlineFromNow,
      ]
      value = BigNumber.from((tokenBIsBNB ? parsedAmountB : parsedAmountA).raw.toString())
    } else {
      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      args = [
        wrappedCurrency(currencyA, chainId)?.address ?? '',
        wrappedCurrency(currencyB, chainId)?.address ?? '',
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        deadlineFromNow,
      ]
      value = null
    }

    setAttemptingTxn(true)
    // const aa = await estimate(...args, value ? { value } : {})
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
        }).then((response) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: `Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${currencies[Field.CURRENCY_A]?.symbol
              } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${currencies[Field.CURRENCY_B]?.symbol}`,
          })

          setTxHash(response.hash)
        })
      )
      .catch((e) => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (e?.code !== 4001) {
          console.error(e)
        }
      })
  }

  const modalHeader = () => {
    return noLiquidity ? (
      <AutoColumn gap="20px">
        <LightCard mt="20px" borderRadius="20px">
          <RowFlat>
            <UIKitText fontSize="48px" mr="8px">
              {`${currencies[Field.CURRENCY_A]?.symbol}/${currencies[Field.CURRENCY_B]?.symbol}`}
            </UIKitText>
            <DoubleCurrencyLogo
              currency0={currencies[Field.CURRENCY_A]}
              currency1={currencies[Field.CURRENCY_B]}
              size={30}
            />
          </RowFlat>
        </LightCard>
      </AutoColumn>
    ) : (
      <AutoColumn gap="20px">
        <RowFlat style={{ marginTop: '20px' }}>
          <UIKitText fontSize="48px" mr="8px">
            {liquidityMinted?.toSignificant(6)}
          </UIKitText>
          <DoubleCurrencyLogo
            currency0={currencies[Field.CURRENCY_A]}
            currency1={currencies[Field.CURRENCY_B]}
            size={30}
          />
        </RowFlat>
        <Row>
          <UIKitText fontSize="24px">
            {`${currencies[Field.CURRENCY_A]?.symbol}/${currencies[Field.CURRENCY_B]?.symbol} Pool Tokens`}
          </UIKitText>
        </Row>
        <UIKitText small textAlign="left" padding="8px 0 0 0 " style={{ fontStyle: 'italic' }}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage / 100
            }% your transaction will revert.`}
        </UIKitText>
      </AutoColumn>
    )
  }

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    )
  }

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${currencies[Field.CURRENCY_A]?.symbol
    } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`

  const handleCurrencyASelect = useCallback(
    (currA: Currency) => {
      const newCurrencyIdA = currencyId(currA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/AddLiquidity/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/AddLiquidity/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA]
  )
  const handleCurrencyBSelect = useCallback(
    (currB: Currency) => {
      const newCurrencyIdB = currencyId(currB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/AddLiquidity/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/AddLiquidity/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/AddLiquidity/${currencyIdA || 'BNB'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  const [isLoading, setIsLoading] = useState(false);
  const { user } = useMoralis();


  return (
    <>
      {isLoading && <Preloader />}
      <div className="lg:block hidden">
        <Scrolling />
      </div>

      <div className="relative flex flex-col items-center justify-between w-full min-h-screen pt-6 mx-auto overflow-x-hidden">

        <Navbar setIsLoading={setIsLoading} />
        <div className="w-full px-3">
          <div className="px-3 w-full">
            <button className="bg-[#ffffff] rounded-md px-5 pb-3 pt-3 stripe_rate_btn mt-7" onClick={eventsModalOpenHandler}>
              <img src="/assets/btn_stripe.png" alt="" /><span className=" tracking-wide">SET RATE FOR STRIPE</span>
            </button>
            <button className="bg-[#ffffff] rounded-md px-5 pb-3 pt-3 stripe_rate_btn mt-2" onClick={eventsModalOpenHandler}>
              <img src="/assets/history.png" alt="no image" className="w-[26px] h-[22px]" /><span className="tracking-wide">TRANSACTION HISTORY</span>
            </button>
          </div>
        </div>
        <div className="px-2 flex justify-center w-full xl:-mt-5 mt-3">
          <div className="flex bg-gray-300 rounded xl:-mt-5 mt-5 sm:max-w-screen-sm max-w-[460px] w-full sm:w-full border-4 border-[#BFBFD1]">
            <Link href="/">
              <div className="flex items-center justify-center h-20 bg-#BFBFD1 rounded w-1/2 font-bold text-2xl text-white cursor-pointer uppercase">
                Swap
              </div>
            </Link>
            <Link href="liquidity">
              <div className="flex items-center justify-center h-20 rounded w-1/2 bg-white text-[#3985F5] font-bold text-2xl tracking-wider cursor-pointer uppercase">
                Liquidity
              </div>
            </Link>
          </div>
        </div>
        {user && user.attributes.isSuperAdmin && (
          <>
            <AppBody>
              <AddRemoveTabs adding />
              <Wrapper>
                <TransactionConfirmationModal
                  isOpen={showConfirm}
                  onDismiss={handleDismissConfirmation}
                  attemptingTxn={attemptingTxn}
                  hash={txHash}
                  content={() => (
                    <ConfirmationModalContent
                      title={
                        noLiquidity
                          ? 'You are creating a pool'
                          : 'You will receive'
                      }
                      onDismiss={handleDismissConfirmation}
                      topContent={modalHeader}
                      bottomContent={modalBottom}
                    />
                  )}
                  pendingText={pendingText}
                />
                <CardBody>
                  <AutoColumn gap="12px">
                    {noLiquidity && (
                      <ColumnCenter>
                        <Pane>
                          <AutoColumn gap="12px">
                            <UIKitText color='black'>{'You are the first liquidity provider.'}</UIKitText>
                            <UIKitText color='black'>
                              {'The ratio of tokens you add will set the price of this pool.'}
                            </UIKitText>
                            <UIKitText color='black'>
                              {'Once you are happy with the rate click supply to review.'}
                            </UIKitText>
                          </AutoColumn>
                        </Pane>
                      </ColumnCenter>
                    )}
                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_A]}
                      onUserInput={onFieldAInput}
                      onMax={() => {
                        onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                      }}
                      onCurrencySelect={handleCurrencyASelect}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                      currency={currencies[Field.CURRENCY_A]}
                      id="add-liquidity-input-tokena"
                      showCommonBases={false}
                    />
                    <ColumnCenter>
                      <AddIcon color="textSubtle" />
                    </ColumnCenter>
                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_B]}
                      onUserInput={onFieldBInput}
                      onCurrencySelect={handleCurrencyBSelect}
                      onMax={() => {
                        onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                      }}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                      currency={currencies[Field.CURRENCY_B]}
                      id="add-liquidity-input-tokenb"
                      showCommonBases={false}
                    />
                    {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
                      <div>
                        <UIKitText
                          style={{ textTransform: 'uppercase', fontWeight: 600 }}
                          color="textSubtle"
                          fontSize="12px"
                          mb="2px"
                        >
                        </UIKitText>
                        <div className='px-1 py-5 bg-[#F6F6F7]'>
                          <PoolPriceBar
                            currencies={currencies}
                            poolTokenPercentage={poolTokenPercentage}
                            noLiquidity={noLiquidity}
                            price={price}
                          />
                        </div>
                      </div>
                    )}

                    {!account ? (
                      // <div>Connect Wallert Button</div>
                      <ConnectWalletButton width="100%" />

                    ) : (
                      <AutoColumn gap="md">
                        {(approvalA === ApprovalState.NOT_APPROVED ||
                          approvalA === ApprovalState.PENDING ||
                          approvalB === ApprovalState.NOT_APPROVED ||
                          approvalB === ApprovalState.PENDING) &&
                          isValid && (
                            <RowBetween>
                              {approvalA !== ApprovalState.APPROVED && (
                                <Button
                                  onClick={approveACallback}
                                  disabled={approvalA === ApprovalState.PENDING}
                                  className="!bg-[#90E040] !shadow-none !rounded-md"
                                  style={{ width: approvalB !== ApprovalState.APPROVED ? '48%' : '100%' }}
                                >
                                  {approvalA === ApprovalState.PENDING ? (
                                    <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                                  ) : (
                                    `Approve ${currencies[Field.CURRENCY_A]?.symbol}`
                                  )}
                                </Button>
                              )}
                              {approvalB !== ApprovalState.APPROVED && (
                                <Button
                                  onClick={approveBCallback}
                                  disabled={approvalB === ApprovalState.PENDING}
                                  className="!bg-[#90E040] !shadow-none !rounded-md"
                                  style={{ width: approvalA !== ApprovalState.APPROVED ? '48%' : '100%' }}
                                >
                                  {approvalB === ApprovalState.PENDING ? (
                                    <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                                  ) : (
                                    `Approve ${currencies[Field.CURRENCY_B]?.symbol}`
                                  )}
                                </Button>
                              )}
                            </RowBetween>
                          )}
                        <Button
                          onClick={() => {
                            if (expertMode) {
                              onAdd()
                            } else {
                              setShowConfirm(true)
                            }
                          }}
                          disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                          className={`!text-white !shadow-none !rounded-md ${(!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]) ? '!bg-[#ED4B9E]' : '!bg-[#90E040]'}`}
                          width="100%"
                        >
                          {error ?? 'Supply'}
                        </Button>
                      </AutoColumn>
                    )}
                  </AutoColumn>
                </CardBody>
              </Wrapper>
              {eventsModalOpen && (
                <RateSetModal onClose={eventsModalCloseHandler} />
              )}
              <Notification setShow={setShow} show={show}>
                <div className="mx-auto transition duration-150 ease-in-out">
                  <div className="w-[296px] h-[75px] bg-white rounded-lg flex flex-col justify-center items-center">
                    <span className="text-[#242424] text-[12px] font-medium tracking-wide uppercase">Transaction submitted</span>
                    <div className="flex gap-x-3 items-center">
                      <span className="mt-1 text-[14px] font-bold text-[#3985F5] uppercase">view on bscscan</span>
                      <ViewScan className="w-[12px] h-[12px] mt-1" />
                    </div>
                  </div>
                </div>
              </Notification>
            </AppBody>
            {/* {pair && !noLiquidity && pairState !== PairState.INVALID ? (
              <AutoColumn style={{ minWidth: '20rem', marginTop: '1rem' }}>
                <MinimalPositionCard showUnwrapped={oneCurrencyIsWBNB} pair={pair} />
              </AutoColumn>
            ) : null} */}
          </>
        )}
        <Footer />
      </div>
    </>

  )
}
