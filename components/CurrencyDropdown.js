/* eslint-disable @next/next/no-img-element */
import Image from 'next/image';
import { useRef, useState } from 'react';
import Chevron from '@/assets/chevron.svg';
import useOutsideClick from '@/hooks/useOutsideClick';

export default function CurrencyDropdown({ options, selectedId, onChange, className }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  const selected = options.find(option => option.id === selectedId);

  useOutsideClick(ref, () => setOpen(false));

  return (
    <div ref={ref} className={`relative rounded-t-lg py-1 w-fit min-w-[134px] ${!open ? 'rounded-b-lg' : ''} ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center w-full px-2.5"
      >
        <img src={selected.image} alt={selected.title} width="28px" height="28px" />
        <span className="text-2xl opacity-50 ml-1.5 text-white">{selected.title}</span>
        <Chevron className="w-3.5 h-1.5 fill-transparent stroke-[#242424] grow" />
      </button>
      {open && (
        <div className="absolute bottom-0 px-2.5 rounded-b-md top-full h-fit w-full bg-[#0c0c0c]">
          {options.map((option) => {
            if (option.id === selected.id) {
              return null;
            }

            return (
              <button
                key={option.id}
                onClick={() => onChange(option.id)}
                className="flex items-center w-full pb-1.5"
              >
                <img src={option.image} alt={option.title} width="28px" height="28px" />
                <span className="text-2xl opacity-50 ml-1.5 text-white">{option.title}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}