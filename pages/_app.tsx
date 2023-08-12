import { Provider } from 'react-redux';
import { Web3ReactProvider } from '@web3-react/core'
import { MoralisProvider } from "react-moralis";
import { ModalProvider } from '@pancakeswap-libs/uikit'
import styled from 'styled-components'
import dynamic from "next/dynamic";
import { ThemeContextProvider } from "../utils/ThemeContext";
import Web3ReactManager from "../components/Web3ReactManager";
import getLibrary from "../utils/getLibrary";
import { HashRouter, Route } from 'react-router-dom'
import store from "../state";
import ApplicationUpdater from '@/state/application/updater'
import ListsUpdater from '@/state/lists/updater'
import MulticallUpdater from '@/state/multicall/updater'
import TransactionUpdater from '@/state/transactions/updater'

import "antd/dist/antd.css";
import "../styles/globals.css";
import "../styles/animate.css"
import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';

const APP_ID = process.env.NEXT_PUBLIC_APP_ID;
const SERVER_URL = process.env.NEXT_PUBLIC_APP_SERVER_URL;

const Web3ProviderNetwork = dynamic(() => import('../components/Web3ProviderNetwork'), { ssr: false })

const AppWrapper = styled.div`
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
`

const BodyWrapper = styled.div`
  ${({ theme }) => theme.mediaQueries.xs} {
    background-size: auto;
  }

  ${({ theme }) => theme.mediaQueries.lg} {
    background-image: url('/images/background.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain, 266px, 266px;
    background-color: #0c0c0c;
    min-height: 90vh;
    font-family: Gilroy Medium;
  }
`


function MyApp({ Component, pageProps }) {

  return (
    <MoralisProvider appId={APP_ID} serverUrl={SERVER_URL} >
      <AppWrapper>
        <Web3ReactProvider getLibrary={getLibrary}>
          <Web3ProviderNetwork getLibrary={getLibrary}>
            <Web3ReactManager>
              <Provider store={store}>
                <ThemeContextProvider>
                  {/* @ts-ignore */}
                  <ModalProvider>
                    <>
                      <ListsUpdater />
                      <ApplicationUpdater />
                      <TransactionUpdater />
                      <MulticallUpdater />
                      <BodyWrapper>

                        <Component {...pageProps} />
                      </BodyWrapper>
                    </>
                  </ModalProvider>
                </ThemeContextProvider>
              </Provider>
            </Web3ReactManager>
          </Web3ProviderNetwork>
        </Web3ReactProvider>
      </AppWrapper>
    </MoralisProvider >
  );
}

export default MyApp;
