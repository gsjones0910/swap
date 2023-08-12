import { useEffect } from "react"

export const Notification = ({children, show, setShow}) => {
    useEffect(() => {
        if(show)
            setTimeout(() => setShow(false), 2000);
    }, [show, setShow])
    return (
        <div className={`${show ? "opacity-100" : "opacity-0"} transition ease-in duration-500 mx-auto absolute top-[110px]`}>{children}</div>
    )
}

export default Notification;