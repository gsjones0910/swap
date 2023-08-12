/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
import Search from "../assets/search.svg";
import Cross from "../assets/cross.svg";
import Link from "next/link";
import EventDate from "./EventDate";
import Event from "./Event";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check2Circle, BoxArrowUpRight } from "react-bootstrap-icons";
import { useMoralis } from "react-moralis";
import { dateFormat, shortenAddress } from "../utils/helperFunction";

const perPage = 10;

export default function EventsModal({ onClose }) {
  const scanUrl = 'https://testnet.bscscan.com/tx/';

  const [totalPage, setTotalPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [swapTokenLogs, setSwapTokenLogs] = useState([]);
  const [toggleFiltersModal, setToggleFiltersModal] = useState(false);
  const [swapTokenLogsQuery, setSwapTokenLogsQuery] = useState([]);
  const { isInitialized, isAuthenticated, Moralis, user } = useMoralis();
  const [lastPage, setLastPage] = useState(1);


  let perPage = 10;
  async function loadSwapTokenLogs() {
    const data = await fetchData();
    setSwapTokenLogsQuery(data);
  }

  useEffect(() => {
    const fn = async () => {
      loadSwapTokenLogs();
    }
    fn()
  }, [isAuthenticated]);

  useEffect(() => {
    setLastPage(getLastPage(swapTokenLogsQuery));
    if (lastPage < currentPage) {
      setCurrentPage(1);
    }
    pagination();
  }, [currentPage, swapTokenLogsQuery]);

  async function fetchData() {
    let query = await Moralis.Cloud.run("getSwapTransfers", {
      searchKeyWord: "",
    });
    if (!query || query.length == 0) {
      return [];
    }

    query = query.filter((log, i) => {
      return log;
    });

    return query.reverse();
  }

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

  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    // let minPage = currentPage - 1;
    setCurrentPage(currentPage - 1);
  };

  function getLastPage(result) {
    if (!result || result.length < 0) {
      return 1;
    }
    return Math.ceil(result.length / perPage);
  }

  return (
    <div className="fixed w-screen h-screen bg-[#242424] top-0 left-0 bg-opacity-50 z-[11] flex justify-end">
      <button
        className="hidden md:flex w-10 h-10 bg-[#f2f3f5] rounded-full justify-center items-center mr-8 mt-20"
        onClick={onClose}
      >
        <Cross className="w-5 h-5 stroke-[#242424]" />
      </button>
      <div className="max-w-2xl w-full h-screen bg-[#F2F3F5] opacity-100 shrink-0 pt-10 md:pt-20 px-10 overflow-y-auto">
        <button
          className="flex md:hidden w-10 h-10 ml-auto bg-[#f2f3f5] rounded-full justify-center items-center mb-8"
          onClick={onClose}
        >
          <Cross className="w-5 h-5 stroke-[#242424]" />
        </button>
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-5xl font-bold uppercase">Events</h2>
        </div> 


        <div className="flex mb-3">
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

        <div className='mb-3'>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate table-auto border-spacing-y-2 table-ylg">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Wallet Address</th>
                  <th>USD</th>
                  <th>YLT</th>
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
                          </div>
                        </div>
                      </td>
                      <td>{shortenAddress(swapTokenLog.address)}</td>
                      <td>{swapTokenLog.token_amount}</td>
                      <td>{swapTokenLog.ylt_amount}</td>
                      <td>{dateFormat(swapTokenLog._created_at?swapTokenLog._created_at:swapTokenLog.createdAt)}</td>
                      <td className="text-center">
                        <a href={swapTokenLog?.scanid ? scanUrl + swapTokenLog?.scanid : "#"} target="_blank" className="text-[#90E040]" rel="noreferrer">
                          {swapTokenLog.token_type == 1 ? "Crypto" : "Stripe"}{" "}
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
        </div> 
        <div >
          <div className="flex mb-10">
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
        </div>
      </div>
    </div>
  );
}


  // <button
  //   className="hidden md:flex w-10 h-10 bg-[#f2f3f5] rounded-full justify-center items-center mr-8 mt-20"
  //   onClick={onClose}
  // >
  //   <Cross className="w-5 h-5 stroke-[#242424]" />
  // </button>
