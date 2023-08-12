/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { useMoralis } from "react-moralis";
import { ethers } from "ethers";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { useRouter } from "next/router";
import { NumericFormat } from "react-number-format";
import CurrencyDropdown from "./CurrencyDropdown";
import useWrapCallback, { WrapType } from '../hooks/useWrapCallback'
import { Field } from 'state/swap/actions'
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '../state/swap/hooks'
import { ArrowRepeat, ArrowDownUp } from "react-bootstrap-icons";
import BUSDTokenABI from "../contracts/abi/BUSDToken.json";
import USDTTokenABI from "../contracts/abi/USDTToken.json";
import YLTABI from "../contracts/abi/YLT.json";
import IUniswapV2Router02ABI from "../contracts/abi/IUniswapV2Router02.json";
import WAValidator from "multicoin-address-validator";
import { useDispatch } from 'react-redux';
import * as notify from '../state/ylttoast/index';
import OneSignal from 'react-onesignal';
import { v4 as uuidv4 } from 'uuid';

const _chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
const YLTtokenAddress = process.env.NEXT_PUBLIC_YLTtokenAddress;
const USDTtokenAddress = process.env.NEXT_PUBLIC_USDTtokenAddress;
const BUSDtoeknAddress = process.env.NEXT_PUBLIC_BUSDtokenAddress;
const RouterAddress = process.env.NEXT_PUBLIC_RouterAddress;

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
const stripePromise = loadStripe(publishableKey);
const isBrowser = typeof window !== "undefined";
const isWallet = isBrowser ? typeof window.ethereum !== "undefined" : false;
const web3Provider = isWallet ? new ethers.providers.Web3Provider(window.ethereum) : null;

const currency = [
  {
    id: 'USD',
    title: "USD",
    image: '/assets/usd.png',
    address: "0x0AE52c26Effaa916251DB39667c4F9b8fE87A321",
    chainId: 97,
    decimals: 18,
    name: "YourLife Token",
    symbol: "YLT",
  },
  {
    id: 'USDT',
    title: "USDT",
    image: '/assets/usdt.png',
    address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    chainId: 97,
    decimals: 18,
    name: "USDT Token",
    symbol: "USDT",
  },
  {
    id: 'BUSD',
    title: "BUSD",
    image: '/assets/busd.png',
    address: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee",
    chainId: 97,
    decimals: 18,
    name: "Binance USD",
    symbol: "BUSD",
  },
];




export default function SwapForm({ setIsLoading }) {

  // pancake hooks
  const { typedValue } = useSwapState()
  const { v2Trade, currencies, inputError: swapInputError } = useDerivedSwapInfo()
  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()
  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue
  )
  const showWrap = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const dispatch = useDispatch();
  // input values
  const [usdAmount, setUsdAmount] = useState(0.0);
  const [ylt, setYlt] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState(currency[0].id);
  const [email, setEmail] = useState("");
  // rates
  const [rateUSDT, setRateUSDT] = useState(0.0);
  const [rateBUSD, setRateBUSD] = useState(0.0);
  const [rateStripe, setRateStripe] = useState(0);
  // balances
  const [yltBalance, setYltBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [busdBalance, setBusdBalance] = useState(0);
  // moralis
  const { user, isAuthenticated, Moralis, authenticate } = useMoralis();
  const [chainId, setChainId] = useState(web3Provider?.network?.chainId);

  const [uid, setUid] = useState(uuidv4());
  // etc
  const router = useRouter();

  // when mounted, initialize web3 modules
  function updateChainId(network) {
    setChainId(network.chainId);
  }
  useEffect(() => {
    if (!isBrowser) return;
    web3Provider?.on('network', updateChainId);
    return () => {
      web3Provider?.removeListener('network', updateChainId);
    }
  }, []);

  useEffect(() => {
    if (typeof window.ethereum == 'undefined') {
      const msg = {
        set: true,
        data: { type: 3, msg: 'You need to install crypto wallet' }
      }
      dispatch(notify.setNotification(msg))
    }
  }, []);

  useEffect(() => {
    async function getBalanceAsync() {
      await getBalance(selectedCurrency);
      const value = await Moralis.Cloud.run("getStripeRate"); 
      setRateStripe(value?.rate);
      await refreshRate();
    };
    getBalanceAsync();
  }, [isAuthenticated, chainId]);

  useEffect(() => {
    async function func() {
      const { status, token, timestamp } = router.query;
      setIsLoading(true);
      if (status == "success" && timestamp?.length > 20) {
        const _item = JSON.parse(localStorage.getItem('item'));
        const data = {
          email: _item.current.email,
          address: _item.current.address,
          tokenAmount: _item.current.price.toString(),
          yltAmount: _item.current.amount.toString(),
          tokenType: 2,
          token: token,
          state: 0,
          usertoken: 'USD',
          scanid: '',
          uid: _item.current.uid,
        }
        // await Moralis.Cloud.run("saveTokenSwap", data); 
        await axios
          .post("api/posts/stripeSuccess",
            {
              status: status,
              timestamp: token,
              data
            },
            {
              headers: {
                "Access-Control-Allow-Origin": "*",
              },
            }
          ).then((res) => {
            setIsLoading(false);
            const msg = {
              set: true,
              data: { type: 1, msg: 'Payment successed! Admin will send token to your wallet, please wait admin email' }
            }
            dispatch(notify.setNotification(msg))
            router.push("/")
          }).catch((e) => {

          })
      }

      setIsLoading(false);

    }
    func();
  }, [router.isReady]);

  useEffect(() => {
    getBalance(selectedCurrency)
  }, [selectedCurrency])


  // swap by using token
  async function swapWithToken() {
    if (chainId != _chainId) return;
    if (!isAuthenticated) {
      authenticate()
      return
    }

    setIsLoading(true);
    const amountOutMin = 0;
    const amountIn = usdAmount;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    let to = null;
    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      to = accounts[0];
    } catch (err) {
      setIsLoading(false);
      return;
    }

    let metaSigner = web3Provider.getSigner(to);


    try {
      const RouterContract = new ethers.Contract(
        RouterAddress,
        IUniswapV2Router02ABI.abi,
        metaSigner
      );

      if (selectedCurrency == "USDT") {
        const path = [USDTtokenAddress, YLTtokenAddress];
        const USDTContract = new ethers.Contract(
          USDTtokenAddress,
          USDTTokenABI,
          metaSigner
        );
        let tx = await USDTContract.approve(
          RouterAddress,
          ethers.utils.parseUnits(Number(amountIn).toString(), 18)
        );
        await tx.wait();
        // transaction to carry
        tx = await RouterContract.swapExactTokensForTokens(
          ethers.utils.parseUnits(Number(amountIn).toString(), 18),
          amountOutMin,
          path,
          to,
          deadline
        );
        const res = await tx.wait();
        await getBalance(selectedCurrency);
        await Moralis.Cloud.run("saveTokenSwap", {
          email: !user?.attributes.email ? email : user?.attributes.email,
          address: to,
          tokenAmount: usdAmount.toString(),
          yltAmount: ylt.toString(),
          tokenType: 1,
          state: 1,
          usertoken: 'USDT',
          scanid: res.transactionHash,
          uid: uid,
        });

        setIsLoading(false);
      }
      if (selectedCurrency == "BUSD") {
        const path = [BUSDtoeknAddress, YLTtokenAddress];
        const BUSDContract = new ethers.Contract(
          BUSDtoeknAddress,
          BUSDTokenABI,
          metaSigner
        );
        let tx = await BUSDContract.approve(
          RouterAddress,
          ethers.utils.parseUnits(Number(amountIn).toString(), 18)
        );
        await tx.wait();

        // transaction to carry
        tx = await RouterContract.swapExactTokensForTokens(
          ethers.utils.parseUnits(Number(amountIn).toString(), 18),
          amountOutMin,
          path,
          to,
          deadline
        );
        const res = await tx.wait();
        await getBalance(selectedCurrency);
        await Moralis.Cloud.run("saveTokenSwap", {
          email: !user?.attributes.email ? email : user?.attributes.email,
          address: to,
          tokenAmount: usdAmount.toString(),
          yltAmount: ylt.toString(),
          tokenType: 1,
          state: 1,
          usertoken: 'BUSD',
          scanid: res.transactionHash,
          uid: uid,
        });

        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
      console.log(">>>TOKEN SWAP ERR")
    }


  }

  // etc
  const refreshRate = async () => {
    if (!isBrowser) return;
    if (chainId != _chainId) return;
    let to = null;
    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      to = accounts[0];
      const metaSigner = web3Provider.getSigner(to);
      const routerContract = new ethers.Contract(
        RouterAddress,
        IUniswapV2Router02ABI.abi,
        metaSigner
      );
      const swapAmount = ethers.utils.parseUnits("1", 18);
      const amountsOutUSDT = await routerContract.getAmountsOut(
        swapAmount.toString(),
        [USDTtokenAddress, YLTtokenAddress]
      );
      const currentRateT = ethers.utils.formatEther(amountsOutUSDT[1]);
      setRateUSDT(Number.parseFloat(currentRateT).toFixed(6));
      const amountsOutBUSD = await routerContract.getAmountsOut(
        swapAmount.toString(),
        [BUSDtoeknAddress, YLTtokenAddress]
      );
      const currentRateB = ethers.utils.formatEther(amountsOutBUSD[1]);
      setRateBUSD(Number.parseFloat(currentRateB).toFixed(6));
    } catch (err) {
      console.log(">>>GET RATE ERR", err.message)
      return 0; // finish function
    }
  };

  const getBalance = async (sc) => {
    if (chainId != _chainId) return;

    try {
      let to = null;
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      to = accounts[0];

      let metaSigner = web3Provider.getSigner(to);
      const BUSDContract = new ethers.Contract(
        BUSDtoeknAddress,
        BUSDTokenABI,
        metaSigner
      );
      const busdBalance = await BUSDContract.balanceOf(to);
      setBusdBalance(busdBalance.toString() / 10 ** 18);

      const USDTContract = new ethers.Contract(
        USDTtokenAddress,
        USDTTokenABI,
        metaSigner
      );
      const usdtBalance = await USDTContract.balanceOf(to);
      setUsdtBalance(usdtBalance.toString() / 10 ** 18);

      const YLTContract = new ethers.Contract(
        YLTtokenAddress,
        YLTABI,
        metaSigner
      );
      const balance = await YLTContract.balanceOf(to);
      setYltBalance(balance.toString() / 10 ** 18);

    } catch (e) {
      console.log(">>GET BALANCE ERR", e.message)
    }
  };

  const handleChangeCurrency = async (currencyId) => {
    if (currencyId == 'USD') {
      setYlt(Number.parseFloat(usdAmount * rateStripe).toFixed(6));
    } else if (currencyId == "USDT") {
      setYlt(Number.parseFloat(usdAmount * rateUSDT).toFixed(6));
      onCurrencySelection(Field.INPUT, currency[1])
      onCurrencySelection(Field.OUTPUT, currency[0])
    } else {
      setYlt(Number.parseFloat(usdAmount * rateBUSD).toFixed(6));
      onCurrencySelection(Field.INPUT, currency[2])
      onCurrencySelection(Field.OUTPUT, currency[0])
    }
    setSelectedCurrency(currencyId);
    await refreshRate();
  };

  const handleUsdAmount = (value) => {
    if (value < 0) value = 0;
    setUsdAmount(value);
    if (selectedCurrency == 'USD') {
      setYlt(value * rateStripe);
    } else if (selectedCurrency == 'USDT') {
      onUserInput(Field.INPUT, value.toString())
      setYlt(value * rateUSDT);
    } else {
      onUserInput(Field.INPUT, value.toString())
      setYlt(value * rateBUSD);
    }
  };

  const handleYLTAmount = (value) => {
    if (value <= 0) {
      value = 0;
      setYlt(0);
      setUsdAmount(0);
    } else {
      setYlt(value);
      if (selectedCurrency == 'USD') {
        setUsdAmount(Number(rateStripe) ? value / rateStripe : 0);
      } else if (selectedCurrency == 'USDT') {
        setUsdAmount(Number(rateUSDT) ? value / rateUSDT : 0);
      } else {
        setUsdAmount(Number(rateBUSD) ? value / rateBUSD : 0);
      }
    }
  };

  const inputMax = () => {
    if (selectedCurrency == "USDT") {
      handleUsdAmount(usdtBalance)
    }
    if (selectedCurrency == "BUSD") {
      handleUsdAmount(busdBalance)
    }
  }

  return (
    <div className="sm:max-w-screen-sm sm:w-full relative mx-3 flex flex-col rounded-2xl pt-3 pb-5 px-2.5 my-10">
      <div className="relative flex flex-col text-5xl mb-2">
        <div className="w-full relative flex">
          <span className="text-[#ffffff] font-bold text-[30px] mb-6">Swap</span>
          <div className="absolute w-10 h-10 flex justify-center items-center right-5 cursor-pointer">
            <ArrowRepeat className="text-white" />
          </div>
        </div>
        <div className="bg-[#0c0c0c] rounded-[32px] p-1">
          <div className="relative w-full">
            <div className={`absolute right-5 top-2/4 -translate-y-2/4 items-end flex flex-row gap-x-5 ${selectedCurrency != "USD" && "mt-2"}`}>
              {selectedCurrency != "USD" && <p className="font-bold text-[14px] text-[#3985F5] mb-3 select-none" style={{ cursor: 'pointer' }} onClick={() => inputMax()}>MAX</p>}
              <div className="flex flex-col">
                {isAuthenticated && selectedCurrency != 'USD' && (
                  <p className="text-sm">Balance: {selectedCurrency == "BUSD" ? busdBalance.toFixed(4) : usdtBalance.toFixed(4)} </p>
                )}
                <CurrencyDropdown
                  options={currency}
                  selectedId={selectedCurrency}
                  onChange={(e) => handleChangeCurrency(e)} />
              </div>
            </div>
            <p className="absolute text-white text-[14px] font-medium !pl-3 pt-3 select-none">From</p>

            <NumericFormat
              placeholder="Enter amount"
              value={usdAmount}
              thousandSeparator={true}
              decimalScale={6}
              onValueChange={(values, sourceInfo) => {
                handleUsdAmount(values.floatValue);
              }}
              className="form-input h-[100px] text-white text-2xl sm:text-3xl pb-0 bg-[#2a2a2a]"
            />
          </div>
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 bg-black rounded-lg flex justify-center items-center p-2">
              <ArrowDownUp className="text-white font-bold"/>
            </div>
          </div>
          <div className="relative w-full">
            <div className={`absolute right-5 top-2/4 -translate-y-2/4 items-end flex flex-row gap-x-5 ${selectedCurrency != "USD" && "mt-2"}`}>
              {selectedCurrency != "USD" && <p className="font-bold text-[14px] text-[#3985F5] mb-3 select-none" style={{ cursor: 'pointer' }} onClick={() => inputMax()}>MAX</p>}
              <div className="flex flex-col">
                {isAuthenticated && selectedCurrency != 'USD' && (
                  <p className="text-sm">Balance: {selectedCurrency == "BUSD" ? busdBalance.toFixed(4) : usdtBalance.toFixed(4)} </p>
                )}
                <CurrencyDropdown
                  options={currency}
                  selectedId={selectedCurrency}
                  onChange={(e) => handleChangeCurrency(e)} />
              </div>
            </div>
            <div className="absolute text-white font-medium text-[14px] pt-5 pl-3 select-none">To (estimated)</div>
            <NumericFormat
              placeholder="YLT Token Amount"
              value={ylt}
              thousandSeparator={true}
              decimalScale={6}
              onValueChange={(values, sourceInfo) => {
                handleYLTAmount(values.floatValue);
              }}
              className="form-input text-[#fbe30f] mt-2 w-full h-[100px] text-2xl sm:text-3xl pb-0 bg-[#2a2a2a]"
            />
          </div>
          <p className="text-white text-xs text-center my-3">
            *Only send to/from wallets. Transactions sent to/from Smart Contracts are not accepted.
          </p>

          <button onClick={swapWithToken} type="submit"
            className="w-full h-16 bg-white border-none text-xl font-bold rounded-full text-black mx-auto mt-2 cursor-pointer"
          >
            Swap Anyway
          </button>
        </div>
      </div>
    </div>

  );
}