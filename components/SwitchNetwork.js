/* eslint-disable react-hooks/exhaustive-deps */
import { useMoralis } from "react-moralis";
import { useState, useEffect, useRef } from "react";
import { bscTestnet, mainnet, polygon } from "@wagmi/chains";
import Web3 from 'web3'
import BNBLogo from '../assets/bnb-logo.svg'
import EthereumLogo from '../assets/ethereum-logo.svg'
import PolygonLogo from '../assets/polygon-logo.svg'

import ArrowUp from '../assets/btn-arrow-up.svg'
import Image from "next/image";
import useOutsideClick from "@/hooks/useOutsideClick";

export default function SwitchNetwork() {
  const [open, setOpen] = useState(false);
  const web3 = new Web3(window.ethereum);
  const ref = useRef(null);
  const chains = [bscTestnet, mainnet, polygon];
  const [selectedChain, setSelectedChain] = useState(chains[0]);
  const [currentChainId, setCurrentChainId] = useState();
  const [selectedChainId, setSelectedChainId] = useState(
    process.env.NEXT_PUBLIC_CHAIN_ID || numberToHex(1)
  );

  const LogoBaseChain = ({id}) => {
    switch(id) {
      case 97:
        return <BNBLogo />
      case 1:
        return <EthereumLogo />
      case 137:
        return <PolygonLogo />
      default:
        return <BNBLogo />
    }
  }

  const onClickChainHandler = (chain) => {
    setSelectedChain(chain);
  }

  console.log('selected chain id', selectedChainId);

  const { Moralis, user, logout, isAuthenticated } = useMoralis();

  useEffect(() => {
    if (isAuthenticated && currentChainId !== selectedChainId) {
      switchNetwork();
    }
  }, [isAuthenticated, selectedChainId]);

  const changeSelectedChainId = (evt) => {
    setSelectedChainId(numberToHex(evt.target.value));
  };

  const switchNetwork = async () => {
    try {
      await web3.currentProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: numberToHex(selectedChainId) }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        // let newNetwork = {};

        chains.map(async (chain) => {
          if (chain.id == selectedChainId) {
            await web3.currentProvider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: numberToHex(selectedChainId),
                  chainName: chain.name,
                  nativeCurrency: {
                    name: chain.nativeCurrency.name,
                    symbol: chain.nativeCurrency.symbol,
                    decimals: chain.nativeCurrency.decimals,
                  },
                  rpcUrls: chain.rpcUrls.default.http,
                  blockExplorerUrls: [chain.blockExplorers.default.url],
                },
              ],
            });
          }
        });

        console.warn("Not working on this network. Please use another network");
      }
    }
  };

  function numberToHex(number) {
    return web3.utils.toHex(number)
  }

  window.ethereum&&window.ethereum.on('chainChanged', (chainId) => {
    setSelectedChainId(numberToHex(chainId));
  });

  useOutsideClick(ref, () => setOpen(false));
  const onClickHandler = () => {
      setOpen(open => !open);
  }

  return (
          <div className={`px-6 py-2 bg-[#90E040] flex flex-col items-center cursor-pointer relative 2xl:min-w-[376px] min-w-0 ${open ? 'rounded-t-md' : 'rounded-md'}`}>
						<div className="w-full flex justify-between items-center gap-x-[10px] tracking-tighter" onClick={onClickHandler} ref={ref}>
              <LogoBaseChain id={selectedChain.id} />
              <span className="text-base font-medium text-white hidden 2xl:flex">{selectedChain.name}</span>
              <ArrowUp className={`${open ? "rotate-180" : ''}`} />
            </div>
            {open && chains.map((chain, index) => {
              const styleMargin = ((index + 1) * 46 + "px");
              return (
                (
                  <div className={`${index === ( chains.length - 1 ) && 'rounded-b-md'} w-full flex 2xl:justify-start justify-center items-center gap-x-[10px] absolute bg-white hover:bg-[#ddd] px-6 py-2`} key={index} onClick={() => onClickChainHandler(chain)}
                  style={{top: styleMargin}}
                  >
                    <LogoBaseChain id={chain.id} />
                    <span className="text-base font-medium text-black hidden 2xl:flex">{chain.name}</span>
                  </div>
                )
              )
            })}
					</div>
  );
}
