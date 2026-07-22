import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../../services/auth";
import { QUERY_KEYS } from "../../constants/queryKeys";
import { getLocalStorageItem } from "../../utils/storage";
import { STORAGE_KEYS } from "../../constants/storage";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.CURRENT_USER],
    queryFn: async () => {
      const user = await getCurrentUser();
      return user;
    },
    enabled: !!getLocalStorageItem(STORAGE_KEYS.ACCESS_TOKEN),
    staleTime: Infinity,
    retry: 1,
  });
};

