import { useQuery } from "@tanstack/react-query";
import type { Session } from "../../services/session/sessionService";
import { fetchSessions } from "../../services/session/sessionService";
import { QUERY_KEYS } from "../../constants/queryKeys";

export const useSessions = () => {
  return useQuery<Session[]>({
    queryKey: [QUERY_KEYS.SESSIONS],
    queryFn: fetchSessions,
    staleTime: Infinity,
    retry: 1,
  });
};
