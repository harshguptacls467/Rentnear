import { useMutation } from "@tanstack/react-query"
import { getSessionMessages } from "../../services/session/sessionService"


export const useSessionMessages = () => {
    return useMutation({
        mutationFn: (sessionid:string)=> getSessionMessages(sessionid)
    })
}