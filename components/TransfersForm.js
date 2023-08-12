/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useMoralis } from "react-moralis";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircleFill, BoxArrowUpRight } from "react-bootstrap-icons";
import FiltersModal from "../components/FiltersModal";
import { shortenAddress, dateFormat } from "../utils/helperFunction";
import { ethers } from "ethers";
import YLTABI from "../contracts/abi/YLT.json";
import { useDispatch } from 'react-redux';
import * as notify from '../state/ylttoast/index';

const YLTtokenAddress = process.env.NEXT_PUBLIC_YLTtokenAddress;
//const AdminAddress = process.env.NEXT_PUBLIC_AdminAddress;

const isBrowser = typeof window !== "undefined";
const web3Provider = isBrowser ? new ethers.providers.Web3Provider(window.ethereum) : null;

export default function TransfersForm({ setIsLoading }) {
  const dispatch = useDispatch();
  const scanUrl = 'https://testnet.bscscan.com/tx/';

  const { isInitialized, isAuthenticated, Moralis } = useMoralis();
  const [swapTokenLogs, setSwapTokenLogs] = useState([]);
  const [toggleFiltersModal, setToggleFiltersModal] = useState(false);
  const [swapTokenLogsQuery, setSwapTokenLogsQuery] = useState([]);
  const [swapLog, setSwapLog] = useState([]);

  const [lastPage, setLastPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [USDamountRange, setUSDamountRange] = useState([0, 0]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedItem, setSelectedItem] = useState([]);
  const [transferState, setTransferState] = useState([0]);

  let perPage = 10;

  async function loadSwapTokenLogs() {
    let query = await Moralis.Cloud.run("getSwapTransfers", {
      searchKeyWord: searchKeyword,
    });
    if (!query || query.length == 0) {
      return [];
    }
    const data = query.reverse(); 
    setSwapLog(data); 
  }

  useEffect(() => {
    if (swapLog.length > 0) {
      var tokenfilter = [];
      paymentTypes.forEach((e) => {
        if (e == 1) {
          tokenfilter.push('BUSD')
          tokenfilter.push('USDT')
        } else if (e == 2) {
          tokenfilter.push('USD')
        } else {
          tokenfilter.push('DIRECT')
        }
      })
      if (tokenfilter.length == 0) {
        tokenfilter.push('BUSD')
        tokenfilter.push('USDT')
        tokenfilter.push('USD')
        tokenfilter.push('DIRECT')
      }
      if (transferState.length == 0) {
        setTransferState([0, 1])
      }

      var log = [];
      swapLog.map((e) => {
        if (transferState.includes(e.state) && tokenfilter.includes(e.usertoken)) {
          if (USDamountRange[1] != 0) {
            if (e.token_amount * 1 > USDamountRange[0] && e.token_amount * 1 < USDamountRange[1]) {
              log.push(e)
            }
          } else {
            log.push(e)
          }
        }
      })
      setSwapTokenLogsQuery(log);
    }

  }, [swapLog, paymentTypes, USDamountRange, transferState, searchKeyword])

  useEffect(() => {
    if (isInitialized) {
      loadSwapTokenLogs();
    }
  }, [isAuthenticated, selectedIds]);

  useEffect(() => {
    setLastPage(getLastPage(swapTokenLogsQuery));
    if (lastPage < currentPage) {
      setCurrentPage(1);
    }
    pagination();
  }, [currentPage, swapTokenLogsQuery]);

  function getLastPage(result) {
    if (!result || result.length < 0) {
      return 1;
    }
    return Math.ceil(result.length / perPage);
  }

  const changeSearchKeyword = (evt) => {
    setSearchKeyword(evt.target.value);
  };


  const pagination = () => {
    if (swapTokenLogsQuery && swapTokenLogsQuery.length > 0) {
      setSwapTokenLogs(
        swapTokenLogsQuery.slice(
          (currentPage - 1) * perPage,
          currentPage * perPage
        )
      );
    } else {
      setSwapTokenLogs([]);
    }
  };

  const filtersModalCloseHandler = () => {
    setToggleFiltersModal(false);
  };

  const showFiltersModal = () => {
    setToggleFiltersModal(true);
  };

  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    // let minPage = currentPage - 1;
    setCurrentPage(currentPage - 1);
  };

  const changeUSDamountRange = (amounts) => {
    setUSDamountRange(amounts);
  };

  const filterByPaymentType = (types) => {
    setPaymentTypes(types);
  };

  const filterByTransferState = (states) => {
    setTransferState(states);
  };

  const transfer = async () => {
    let to = null;
    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });
    to = accounts[0];


    let metaSigner = web3Provider.getSigner(to);
    const YLTContract = new ethers.Contract(
      YLTtokenAddress,
      YLTABI,
      metaSigner
    );

    setIsLoading(true);

    try {
      for (let i = 0; i < selectedItem.length; i++) {
        const receiver_address = selectedItem[i]['address'];
        const receiver_email = selectedItem[i]['email'];
        const YLT_amount = selectedItem[i]['ylt_amount'];
       

        let tx = await YLTContract.transfer(
          receiver_address,
          ethers.utils.parseUnits(Number(YLT_amount).toString(), 18)
        );
        const res = await tx.wait();

        if (res.status) {
          var Data = {
            set: true,
            data: { type: 1, msg: 'Token was sent successfully to ' + receiver_address }
          }
          dispatch(notify.setNotification(Data))
          await Moralis.Cloud.run("updateSwapTokenLog", {
            objectId: selectedItem[i]['objectId'],
            scanid: res.transactionHash,
            state: 1,
          });
          await Moralis.Cloud.run("sendTokenEmail", {
            to: receiver_email,
            amount: YLT_amount
          })
          await Moralis.Cloud.run("sendPushNotification", {
            to: receiver_email,
            amount: YLT_amount
          })
        } else {
          var Data = {
            set: true,
            data: { type: 1, msg: 'Token sending failed to' + receiver_address + ". Try again later." }
          }
          dispatch(notify.setNotification(Data))
        }
      }
    } catch (e) {
      console.log(">>>h error", e)
      setIsLoading(false);
    }
    await loadSwapTokenLogs();
    setIsLoading(false);
    setSelectedIds([]);
    pagination();
  };

  const changeSelectedId = (objId, item) => {
    let ids = selectedIds;
    let items = selectedItem;
    const index = ids.indexOf(objId);
    if (index === -1) {
      ids.push(objId);
      items.push(item);
    } else {
      ids.splice(index, 1);
      items.splice(index, 1);
    }
    setSelectedIds(ids);
    setSelectedItem(items)
    pagination();
  };

  return (
    <div className="relative w-full px-8 pt-3 pb-5">
      {" "}
      {/* Inner Container */}
      <div>
        <Link href="/" className="text-slate-500 hover:text-slate-800">
          Back
        </Link>
      </div>
      <div className="text-6xl font-bold uppercase mt-7">Swap Transfers</div>
      {/* ---------------------- Table with pagination ------------------  */}
      <div className="pt-16">
        {/* header */}
        <div className="flex justify-between">
          <div className="flex pt-2">
            <div className="pt-1">
              {currentPage} / {lastPage}
            </div>

            <div className="pl-6 pr-8">
              {currentPage > 1 ? (
                <button
                  className="max-w-fit  max-h-fit bg-white rounded-full p-1.5"
                  onClick={prevPage}
                >
                  <ArrowLeft className="text-blue-600" />
                </button>
              ) : (
                <div className="max-w-fit  max-h-fit bg-white rounded-full p-1.5">
                  <ArrowLeft className="text-garry-600" />
                </div>
              )}
            </div>

            <div>
              {currentPage < lastPage ? (
                <button
                  className="max-w-fit  max-h-fit bg-white rounded-full p-1.5"
                  onClick={nextPage}
                >
                  <ArrowRight className="text-blue-600" />
                </button>
              ) : (
                <div className="max-w-fit  max-h-fit bg-white rounded-full p-1.5">
                  <ArrowRight className="text-garry-600" />
                </div>
              )}
            </div>
          </div>

          <div className="flex">
            <div>
              <label className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">
                Search
              </label>
              <div className="relative">
                <input
                  type="search"
                  id="search"
                  className="block xl:w-[600px] lg:w-[400px] w-full p-3 pl-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 focus:outline-none"
                  placeholder="Search"
                  required
                  onChange={(e) => changeSearchKeyword(e)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={showFiltersModal}
              className="px-5 py-3 mb-2 mr-2 text-sm font-medium text-center text-blue-700 border border-blue-700 rounded-lg ml-7 hover:text-white hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-600 dark:focus:ring-blue-800"
            >
              Filters
            </button>
          </div>
        </div>
        <div>
          <div className="flex justify-end">
            {selectedIds.length > 0 ? (
              <button onClick={transfer} className="btn-primary uppercase mt-4">
                confirm transactions
              </button>
            ) : (
              <button className="btn-primary uppercase mt-4" disabled>
                confirm transactions
              </button>
            )}
          </div>
        </div>

        {/* body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate table-auto border-spacing-y-2 table-ylg">
            <thead>
              <tr>
                <th>User</th>
                <th>Wallet Address</th>
                <th>USD</th>
                <th>YLT</th>
                <th>TIMESTAMP</th>
                <th>SENT</th>
                <th className="flex items-center gap-x-1 text-align-center">
                  TRANSACTION
                  <BoxArrowUpRight />
                </th>
                {/* <th></th> */}
              </tr>
            </thead>
            <tbody>
              {swapTokenLogs ? (
                swapTokenLogs.map((swapTokenLog, i) => (
                  <tr key={i}>
                    <td>
                      <div className="td-avatar-group">
                        <img
                          src={
                            swapTokenLog.user[0]?.profile_picture
                              ? swapTokenLog.user[0].profile_picture
                              : '/assets/user.png'
                          }
                          width={50}
                          height={50}
                          className="rounded-full bg-[#90e040] avatar-sm"
                          alt="profile picture"
                        />
                        <div className="px-2">
                          <div className="text-center">
                            {swapTokenLog.user[0]?.nickname
                              ? swapTokenLog.user[0].nickname
                              : shortenAddress(swapTokenLog.address)}
                          </div>
                          <div className="text-center">
                            {" "}
                            {swapTokenLog.state == 0 &&
                              swapTokenLog.token_type == 2 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeSelectedId(swapTokenLog.objectId, swapTokenLog)
                                  }
                                  className={`btn-primary ${selectedIds.includes(swapTokenLog.objectId)
                                    ? "uppercase"
                                    : "uppercase"}`}
                                >
                                  {selectedIds.includes(swapTokenLog.objectId)
                                    ? "Unselect"
                                    : "Select"}
                                </button>
                              )}{" "}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{shortenAddress(swapTokenLog.address)}</td>
                    <td>{swapTokenLog.token_amount}</td>
                    <td>{swapTokenLog.ylt_amount}</td>
                    <td>{dateFormat(swapTokenLog._created_at?swapTokenLog._created_at:swapTokenLog.createdAt)}</td>
                    <td>{dateFormat(swapTokenLog._created_at?swapTokenLog._created_at:swapTokenLog.createdAt)}</td>
                    <td className="text-center">
                      <a href={swapTokenLog?.scanid ? scanUrl + swapTokenLog?.scanid : "#"} target="_blank" className="text-[#90E040]" rel="noreferrer">
                        {swapTokenLog.token_type == 1 ? "Crypto" : swapTokenLog.token_type == 2 ? "Stripe" : "Direct"}{" "}
                        {swapTokenLog?.scanid != "" ? <BoxArrowUpRight className="inline-block" /> : <></>}
                      </a>
                      {
                        swapTokenLog.usertoken == "USDT" || swapTokenLog.usertoken == "BUSD" ?
                          <div className="cv-wrap">
                            <img className="cv-token-img-1" src={swapTokenLog.usertoken == "BUSD" ? "/assets/busd.png" : "/assets/usdt.png"} alt="" />
                            <img className="cv-token-img-1" src="/assets/ylt.svg" alt="" />
                          </div>
                          : <></>
                      }
                    </td> 
                  </tr>
                ))
              ) : (
                <></>
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="flex justify-between">
          <div className="flex">
            <div className="pt-1">
              {currentPage} / {lastPage}
            </div>
            <div className="pl-6 pr-8">
              {currentPage > 1 ? (
                <button
                  className="max-w-fit  max-h-fit bg-white rounded-full p-1.5"
                  onClick={prevPage}
                >
                  <ArrowLeft className="text-blue-600" />
                </button>
              ) : (
                <div className="max-w-fit  max-h-fit bg-white rounded-full p-1.5">
                  <ArrowLeft className="text-garry-600" />
                </div>
              )}
            </div>

            <div>
              {currentPage < lastPage ? (
                <button
                  className="max-w-fit  max-h-fit bg-white rounded-full p-1.5"
                  onClick={nextPage}
                >
                  <ArrowRight className="text-blue-600" />
                </button>
              ) : (
                <div className="max-w-fit  max-h-fit bg-white rounded-full p-1.5">
                  <ArrowRight className="text-garry-600" />
                </div>
              )}
            </div>
          </div>
          <div className="flex">
            {selectedIds.length > 0 ? (
              <button onClick={transfer} className="btn-primary uppercase mt-4">
                confirm transactions
              </button>
            ) : (
              <button className="btn-primary uppercase mt-4" disabled>
                confirm transactions
              </button>
            )}
          </div>
        </div>
      </div>
      {toggleFiltersModal && (
        <FiltersModal
          onClose={filtersModalCloseHandler}
          changeUSDamountRange={changeUSDamountRange}
          USDamountRange={USDamountRange}
          filterByPaymentType={filterByPaymentType}
          paymentTypes={paymentTypes}
          filterByTransferState={filterByTransferState}
          transferState={transferState}
        />
      )}
    </div>
  );
}
