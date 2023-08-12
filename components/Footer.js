import FooterLogo from '../assets/footer-logo.svg'
import Link from 'next/link';
import {footerLinks} from '../constants/menu'
import { useMoralis } from "react-moralis";
import { useEffect, useState } from 'react';

export default function Footer() {
    const [tokenURI, setTokenURI] = useState("")
    const { authenticate, isAuthenticated, user } = useMoralis();
    useEffect(() => {
		setTokenURI(`?token=${user?.id}`)
	}, [isAuthenticated])
    return (
        <footer className="px-3 w-full">
            <div className="w-full h-[136px] flex items-center px-5 md:px-7 bg-[#61616A] rounded-lg">
                <div className="flex justify-between w-full">
                    <FooterLogo className="h-20" />
                    <div className="hidden md:flex items-center">
					{footerLinks.map((link) => (
						<Link key={link.id} href={`${link.url}${tokenURI}`}>
							<a className="flex text-md text-white uppercase underline underline-offset-8 underline-color decoration-[#3985F5] mr-4">
								{link.icon && (
									<span className="mr-2">
										{link.icon}
									</span>
								)}
								{link.title}
							</a>
						</Link>
					))}
				</div>
                </div>
            </div>
            <p className="uppercase text-[#646464] ml-5 sm:ml-14">Yourlife. 2022</p>
        </footer>
    )
}