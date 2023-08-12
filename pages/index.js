/* eslint-disable jsx-a11y/alt-text */
import { useEffect, useState } from "react";
import { useMoralis } from "react-moralis";
import "react-dropdown/style.css";
import Link from "next/link";
import Head from "next/head";
import { Scrolling } from "../components/Scrolling";
import Image from 'next/image';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader/Preloader";
import SwapForm from "../components/SwapForm";
import RateSetModal from "../components/RateSetModal";
import "antd/dist/antd.css";
import EventsModal from "../components/EventsModal";

const options = [
  { label: 'Swap', value: 'swap' },
  { label: 'Liquidity', value: 'liquidity' },
];

export default function Home() {
  
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useMoralis();   
  const [eventsModalOpen, setEventsModalOpen] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);
 

  const eventsModalOpenHandler = () => {
    setEventsModalOpen(true);
  } 
  const rateModalOpenHandler = () => {
    setRateModalOpen(true);
  }

  const eventsModalCloseHandler = () => {
    setEventsModalOpen(false);
    setRateModalOpen(false);
  }

  return (
    <div>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* <!-- HTML Meta Tags --> */}
        <meta
          name="description"
          content="PUT THE FUTURE IN YOUR HANDS - Money from the Player NFT sales is transferred to real teams to help support and develop youth sports leagues! Live YourLIfe and Earn!"
        />

        {/* <!-- Google / Search Engine Tags --> */}
        <meta itemProp="name" content="Your Life Games" />
        <meta
          itemProp="description"
          content="PUT THE FUTURE IN YOUR HANDS - Money from the Player NFT sales is transferred to real teams to help support and develop youth sports leagues! Live YourLife and Earn!"
        />
        <meta
          itemProp="image"
          content="https://nft.yourlifegames.com/static/media/yourlife_white.605e26de.png"
        />

        {/* <!-- Facebook Meta Tags --> */}
        <meta property="og:url" content="https://www.yourlifegames.com" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Your Life Games" />
        <meta
          property="og:description"
          content="PUT THE FUTURE IN YOUR HANDS - Money from the Player NFT sales is transferred to real teams to help support and develop youth sports leagues! Live YourLife and Earn!"
        />
        <meta
          property="og:image"
          content="https://nft.yourlifegames.com/static/media/yourlife_white.605e26de.png"
        />

        {/* <!-- Twitter Meta Tags --> */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Life Games" />
        <meta
          name="twitter:description"
          content="PUT THE FUTURE IN YOUR HANDS - Money from the Player NFT sales is transferred to real teams to help support and develop youth sports leagues - This unique opportunity provides both Fun & Finances at the same time! Live YourLife and Earn!"
        />
        <meta
          name="twitter:image"
          content="https://nft.yourlifegames.com/static/media/yourlife_white.605e26de.png"
        />
      </Head>
      {isLoading && <Preloader />}
      <div className="relative flex flex-col items-center max-w-[1400px] w-[80%] min-h-screen pt-6 mx-auto overflow-x-hidden">
        {/* Main Container */}
        <Navbar setIsLoading={setIsLoading} />
        <div className="relative flex flex-row items-center justify-center flex-1">
          <div className="w-[100%]">
            <div className="w-[80%]">
              <p className="text-[34px] text-white font-bold" style={{fontFamily:"Gilroy black"}}>Swap like you mean it</p>
              <span className="text-gray-500 text-lg">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
              </span>
            </div>
          </div>
          <SwapForm setIsLoading={setIsLoading} />
        </div>
      </div>
    </div>
  );
}
