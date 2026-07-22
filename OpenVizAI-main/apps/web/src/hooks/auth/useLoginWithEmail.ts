import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginWithEmail, type LoginResponse } from "../../services/auth";
import { setLocalStorageItem } from "../../utils/storage";
import { STORAGE_KEYS } from "../../constants/storage";
import { QUERY_KEYS } from "../../constants/queryKeys";

export const useLoginWithEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string): Promise<LoginResponse> =>
      loginWithEmail(email),
    onSuccess: (data) => {
      setLocalStorageItem(
        STORAGE_KEYS.ACCESS_TOKEN,
        data.tokens.access_token,
      );
      setLocalStorageItem(
        STORAGE_KEYS.REFRESH_TOKEN,
        data.tokens.refresh_token,
      );

      // Ensure current user query is up to date
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CURRENT_USER] });
    },
  });
};

