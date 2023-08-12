/* eslint-disable react-hooks/exhaustive-deps */
import { Scrolling } from "../components/Scrolling";
import "react-dropdown/style.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader/Preloader";
import RateSetModal from "../components/RateSetModal";
import LiquidityForm from "./Pool";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useMoralis } from "react-moralis";
import { useRouter } from "next/router"; 

export default function Liquidity() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useMoralis();
  
  const eventsModalCloseHandler = () => {
		setEventsModalOpen(false);
	}
  const [eventsModalOpen, setEventsModalOpen] = useState(false);
	const eventsModalOpenHandler = () => {
		setEventsModalOpen(true);
	}
  useEffect(() => {
    if (!user || !user.attributes.isSuperAdmin) {
      router.push('/');
    }
  }, []);

  return (
    <>
      {isLoading && <Preloader />}
      <div className="lg:block hidden">
				<Scrolling />
			</div>
      <div className="relative flex flex-col items-center justify-between w-full min-h-screen pt-6 mx-auto overflow-x-hidden">

        <Navbar setIsLoading={setIsLoading} />

        {user && user.attributes.isSuperAdmin && (
          <>
            <div className="px-3 w-full">
              <button className="bg-[#ffffff] rounded-md px-5 pb-3 pt-3 stripe_rate_btn mt-2" onClick={eventsModalOpenHandler}>
                <img src="/assets/btn_stripe.png" alt="" /><span className=" tracking-wide">SET RATE FOR STRIPE</span>
              </button>
              <button className="bg-[#ffffff] rounded-md px-5 pb-3 pt-3 stripe_rate_btn mt-2" onClick={eventsModalOpenHandler}>
                <img src="/assets/history.png" alt="no image" className="w-[26px] h-[22px]" /><span className="tracking-wide">TRANSACTION HISTORY</span>
              </button>
            </div>
            <div className="px-2 flex justify-center w-full">
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
            <LiquidityForm /> 
            {eventsModalOpen && (
						<RateSetModal onClose={eventsModalCloseHandler} />
					)}
          </>
        )}
        <Footer />
      </div>
    </>
  );
}
