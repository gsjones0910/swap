import { useState } from 'react';
import { useEffect } from 'react';
import { useMoralis } from "react-moralis";
import Cross from '@/assets/cross.svg';
import { ChevronUp, ChevronDown } from "react-bootstrap-icons"
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";

export default function FiltersModal({ onClose, changeUSDamountRange, USDamountRange, filterByPaymentType, paymentTypes, transferState, filterByTransferState }) {
  const [USDminAmount, setUSDminAmount] = useState(USDamountRange[0]);
  const [USDmaxAmount, setUSDmaxAmount] = useState(USDamountRange[1]);
  const [crypto, setCrypto] = useState(paymentTypes.includes(1) ? true : false);
  const [stripe, setStripe] = useState(paymentTypes.includes(2) ? true : false);  
  const [direct, setDirect] = useState(paymentTypes.includes(3) ? true : false);
  const [sent, setSent] = useState(transferState.includes(1) ? true : false);
  const [notSent, setNotSent] = useState(transferState.includes(0) ? true : false);
  const [selectedItem, setSelectedItem] = useState([true, true, true])
  // const { isAuthenticated, Moralis } = useMoralis();


  const changeUSDAmount = (amounts) => {
    setUSDminAmount(amounts[0]);
    setUSDmaxAmount(amounts[1]);
  }

  const getData = () => {
    changeUSDamountRange([USDminAmount, USDmaxAmount]);
  }

  const changePaymentType = (evt) => {   
    let types = [];  
    if (evt.target.name == "stripe") {
      setStripe(!stripe)
      if (!stripe) {
        types.push(2)
      }
      if (crypto) {
        types.push(1)
      }
      if (direct){
        types.push(3)
      }
    } else if(evt.target.name == "direct") {
      setDirect(!direct)
      if (!direct){
        types.push(3)
      }
      if (stripe) {
        types.push(2)
      }
      if (crypto) {
        types.push(1)
      } 
    }  else {
      setCrypto(!crypto)
      if (!crypto) {
        types.push(1)
      }
      if (stripe) {
        types.push(2)
      }      
      if (direct){
        types.push(3)
      }
    }     
    filterByPaymentType(types)
  }


  const changeTransferState = (evt) => {
    let states = [];
    if (evt.target.name == "sent") {
      setSent(!sent)

      if (!sent) {
        states.push(1)
      }

      if (notSent) {
        states.push(0)
      }
    } else {
      setNotSent(!notSent)

      if (sent) {
        states.push(1)
      }

      if (!notSent) {
        states.push(0)
      }
    }   
    filterByTransferState(states)
  }

  const onChevronHandler = (id) => {
    setSelectedItem(prevState => {
      const updatedState = [...prevState];
      updatedState[id] = !updatedState[id];
      return updatedState;
    });
  }

  // useEffect(() => {

  // }, [isAuthenticated]);

  return (
    <div className="fixed w-screen h-screen bg-[#242424] top-0 left-0 bg-opacity-50 flex justify-end z-20">
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
        <form action='#'>
          <div className='divide-y'>
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-5xl font-bold uppercase">Filters</h2>
            </div>

            {/* USD range */}
            <div>
              <div className='flex justify-between mt-3 cursor-pointer' >
                <div className='text-2xl font-bold'>USD</div>
                <ChevronUp className={`${selectedItem[0] ? 'rotate-0' : 'rotate-180'} text-lg text-sky-500`}/>
              </div>
              {
                selectedItem[0] && (
                  <>
                    <div className="flex justify-between">
                      <div className='flex'>
                        <label className='pt-2 pr-4 text-lg'>of</label>
                        <input type="text" className='px-3 py-2 text-lg rounded-lg' value={ USDminAmount } readOnly />
                      </div>

                      <div className='flex'>
                        <label className='pt-2 pr-4 text-lg'>to</label>
                        <input type="text" className='px-3 py-2 text-lg rounded-lg' value={ USDmaxAmount } readOnly />
                      </div>
                    </div>

                    <div className={`pt-8 ${selectedItem[0] ? 'block' : 'hidden'}`}>
                      <RangeSlider min={0} max={1000} defaultValue={[USDminAmount, USDmaxAmount]} onInput={(value, userInteraction) => changeUSDAmount(value)} onThumbDragEnd={getData} />
                    </div>
                  </>
                )
              }
            </div>

            {/* Kind of Payment */}
            <div className='mt-8 cursor-pointer'>
              <div className='flex justify-between mt-3' >
                <div className='text-2xl font-bold'>Kind of Payment</div>
                <ChevronUp className={`${selectedItem[1] ? 'rotate-0' : 'rotate-180'} text-lg text-sky-500`}/>
              </div>

              {
                selectedItem[1] && (
                  <div className='mt-3'>
                    <div>
                      <input type="checkbox" onChange={ evt => changePaymentType(evt) } name="crypto" id="filter_crypto" value={1} checked={crypto} />
                      <label htmlFor="filter_crypto" className='ml-3 text-lg'>Crypto</label>
                    </div>
                    <div>
                      <input type="checkbox" onChange={ evt => changePaymentType(evt) } name="stripe" id="filter_stripe" value={2} checked={stripe} />
                      <label htmlFor="filter_stripe" className='ml-3 text-lg'>Stripe</label>
                    </div> 
                    <div>
                      <input type="checkbox" onChange={ evt => changePaymentType(evt) } name="direct" id="filter_direct" value={3} checked={direct} />
                      <label htmlFor="filter_direct" className='ml-3 text-lg'>Direct</label>
                    </div>
                  </div>
                )
              }
            </div>

            {/* Transfer Sent */}
            <div className='mt-8 cursor-pointer' >
              <div className='flex justify-between mt-3'>
                <div className='text-2xl font-bold'>Transfer Sent</div>
                <ChevronUp className={`${selectedItem[2] ? 'rotate-0' : 'rotate-180'} text-lg text-sky-500`}/>
              </div>

              {
                selectedItem[2] && (
                  <div className='mt-3'>
                    <div>
                      <input type="checkbox" onChange={ evt => changeTransferState(evt) } name="sent" value={1} id="sent" checked={sent} />
                      <label htmlFor="sent" className='ml-3 text-lg'>Yes</label>
                    </div>
                    <div>
                      <input type="checkbox" onChange={ evt => changeTransferState(evt) } name="notsent" value={0} id="notsent" checked={notSent} />
                      <label htmlFor="notsent" className='ml-3 text-lg'>No</label>
                    </div>
                  </div>
                )
              }
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}