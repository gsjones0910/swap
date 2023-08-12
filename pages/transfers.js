/* eslint-disable react-hooks/exhaustive-deps */
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TransfersForm from "../components/TransfersForm";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useMoralis } from "react-moralis";
import Preloader from "../components/Preloader/Preloader";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const { user } = useMoralis()
  const router = useRouter()

  useEffect(() => { 
    if (user == null || !user.get("isSuperAdmin")) {
      router.push('/')
      return
    }
    setIsLoading(false)
    setIsAdmin(true)
  }, [user])

  return (
    <>
      {isLoading && <Preloader />}
      <div className="min-h-screen w-full relative overflow-x-hidden mx-auto flex flex-col pt-6">
        <Navbar setIsLoading={setIsLoading} />
        {isAdmin && <>
          <TransfersForm setIsLoading={setIsLoading} />
          <Footer />
        </>}
      </div>
    </>
  );
}
