/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { useMoralis } from "react-moralis"; 
import { Web3Auth } from "@web3auth/web3auth";
import { Router } from "next/router"; 
import Chevron from '@/assets/chevron.svg';
import useOutsideClick from "../hooks/useOutsideClick";
import Bell from '@/assets/bell.svg';
import { BoxArrowInRight } from 'react-bootstrap-icons'

const isBrowser = typeof window !== 'undefined';

export default function Account({ setIsLoading, openEventsModal, onAuth }) {
  const ref = useRef(null);
  const { Moralis, user, logout, isAuthenticated } = useMoralis();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const profilePicture = user?.attributes.profile_picture;

  useEffect(() => { 
    if (!isBrowser) return;
    if (isAuthenticated) {
      const loadEmail = async () => {
        try {
          const web3Auth = new Web3Auth({
            clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
            chainConfig: {
              chainNamespace: process.env.NEXT_PUBLIC_CHAIN_NAMESPACE,
              chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
              rpcTarget: process.env.NEXT_PUBLIC_SERVER_URL,
              displayName: process.env.NEXT_PUBLIC_DISPLAY_NAME,
              blockExplorer: process.env.NEXT_PUBLIC_BLOCK_EXPLORER,
              ticker: process.env.NEXT_PUBLIC_TICKER,
              tickerName: process.env.NEXT_PUBLIC_TICKER_NAME
            }
          });

          await web3Auth.initModal();
          const userInfo = await web3Auth.getUserInfo();

          if (userInfo.email) {
            const isEmail = await Moralis.Cloud.run('searchEmail', {
              email: userInfo.email,
              ethAddress: address
            }); 
            if (isEmail) {
              const { id } = user;
              await logout();
              const result = await Moralis.Cloud.run('deleteRecord', { id })
              if (result) {
                alert('This email already exist');
                Router.push('/')
              }
            } else {
              const { id } = user;
              const result = await Moralis.Cloud.run('addEmail', { id, email: userInfo.email })
              if (result) {
                Router.push('/');
              }
            }
          } else {
            if (!user.attributes.email) {
            } else {
              Router.push('/');
            }
          }
        } catch (error) {
          // console.log('catch', error);
        }
      };
      loadEmail();
    }
  }, [isAuthenticated, Router, logout, user]);

  const getUserName = () => {
    if (user && user.attributes.nickname) {
      return user.attributes.nickname;
    }
    const { ethAddress } = user?.attributes;
    return `${ethAddress?.slice(0, 6)
      }...${ethAddress?.slice(-4)
      }`
  };

  const toggleUserMenu = () => setUserMenuOpen(userMenuOpen => !userMenuOpen)
  const closeUserMenu = () => setUserMenuOpen(false)
  useOutsideClick(ref, closeUserMenu);

  if (isAuthenticated) {
    return (
      <div ref={ref} className="relative flex items-center justify-center">
        <button onClick={toggleUserMenu} className="flex items-center lg:flex-row flex-col">
          <div className='w-[30px] h-[30px]'>
            <img src={profilePicture && profilePicture ? profilePicture : '/assets/user.png'}
              width="30px"
              height="30px"
              className="rounded-full bg-[#90e040]"
              alt="profile picture 22" />
          </div>
        </button>
        {userMenuOpen &&
          <div className='absolute top-16 shadow-[0_0px_10px_2px_rgba(0,30,0,0.15)] rounded-lg bg-white nav-dropdown'>
            <div className='flex flex-col justify-between items-center py-6 h-[250px] w-[200px]'>
            <div className='flex flex-col justify-center items-center px-4'>
              <img src={profilePicture && profilePicture ? profilePicture : '/assets/user.png'}
                width="60px"
                height="60px"
                className="rounded-full bg-[#90e040]"
                alt="profile picture 22" />
              <p className='text-lg text-[#242424]'>{getUserName()}</p>
            </div>
            <div className='flex gap-x-5 justify-center items-center cursor-pointer hover:bg-[#F2F7F2] py-2 w-full' onClick={logout}>
              <BoxArrowInRight size="20" />
              <p className='text-lg text-[#242424] uppercase'>Logout</p>
            </div>
            </div>
          </div>
          }
        <div className="h-12 w-[1px] bg-[#242424] mx-4 opacity-30"></div>
        <button className="h-8 w-8 rounded-full bg-[#F3F4F6] shrink-0 flex justify-center items-center"
          onClick={openEventsModal}>
          <Bell />
        </button>
      </div>
    );
  } else {
    return (
      <button onClick={onAuth}
        type="button"
        className="hidden sm:flex items-center bg-[#ffffff] py-2 px-6 rounded-full font-bold text-[20px] text-black uppercase h-16">
        connect wallet
      </button>
    );
  }   
}