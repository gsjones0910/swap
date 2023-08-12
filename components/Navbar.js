/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from "next/link";
import Account from "./Account";
import { useMoralis } from "react-moralis";
import MarketPlaceSVG from '/assets/marketplace.svg';
import { useSelector, useDispatch } from 'react-redux';
import * as notify from '../state/ylttoast/index';
import OneSignal from 'react-onesignal';

export default function Navbar({ setIsLoading }) {

  const dispatch = useDispatch();
  const notiInfo = useSelector(({ notification }) => notification.value);

  useEffect(() => {
    const set = notiInfo.set;
    const data = notiInfo.data;
    if (set && data) {
      if (data.type == 1) {
        toast(data.msg, { type: toast.TYPE.INFO, autoClose: 6000 })
      }
      if (data.type == 3) {
        toast(data.msg, { type: toast.TYPE.WARNING, autoClose: 6000 })
      }
      clearNotify()
    }

  }, [notiInfo])

  const clearNotify = () => {
    const msg = {
      set: false,
      data: {}
    }
    dispatch(notify.setNotification(msg))
  }

  const [eventsModalOpen, setEventsModalOpen] = useState(false);
  const [tokenURI, setTokenURI] = useState("")
  const { authenticate, isAuthenticated, user, enableWeb3, Moralis } = useMoralis();  

  const authUser = async () => {
    const connectorId = window.localStorage.getItem("connectorId")
    await enableWeb3({ throwOnError: true, provider: connectorId });
    const { account, chainId } = Moralis;
    const { message } = await Moralis.Cloud.run('requestMessage', {
      address: account,
      chain: parseInt(chainId, 16),
      url: process.env.NEXT_PUBLIC_APP_URL,
      networkType: 'evm',
    });
    // Authenticate and login via parse
    await authenticate({
      signingMessage: message,
      throwOnError: true,
    }).then((user) => {
      if (user) {

      } else {

      }
    })
  }

  const eventsModalOpenHandler = () => setEventsModalOpen(true)

  useEffect(() => {
    setTokenURI(`?token=${user?.id}`)
    if (user != null && user.attributes.isSuperAdmin) {
      OneSignal.sendTag('admin', "superAdmin");
    }
  }, [isAuthenticated])

  return (
    <div className="w-full flex items-center h-20 px-3 text-center shrink-0 navbar-zindex">
      <div>        
        <img src="/assets/swapWagonLogo.png" alt="no image" className="h-[80px]" />
      </div>

      <div className="flex h-full w-full items-center justify-end">
        <div className="relative items-center hidden lg:flex lg:gap-x-8">
          <Link key={1} href="/"><span className="flex text-[18px] text-[#ffffff] decoration-[#3985F5]">Swap</span></Link>
          <Link kye={2} href="/"><span className="flex text-[18px] text-[#ffffff] decoration-[#3985F5]">How it works</span></Link>
          <Link kye={3} href="/"><span className="flex text-[18px] text-[#ffffff] decoration-[#3985F5]">FAQ</span></Link>
          <Link kye={3} href="/"><span className="flex text-[18px] text-[#ffffff] decoration-[#3985F5]">$ATK</span></Link>
          <Account
            setIsLoading={setIsLoading}
            openEventsModal={eventsModalOpenHandler}
            onAuth={authUser}
          />
        </div>
      </div>
      <ToastContainer />
    </div >

  );
};
