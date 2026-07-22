import type { SessionMessageResponse } from "../../types/chat";
import { APIService } from "../apiService";

export type Session = {
  session_id: string;
  user_id: string;
  title: string;
  created_ts: string;
  updated_ts: string;
};



export type SessionsListResponse = Session[];

// fetch all sessions for current user
export const fetchSessions = (): Promise<SessionsListResponse> => {
  return APIService.get<SessionsListResponse>("/api/ai/sessions");
};

// create a new session (optionally provide a title)
export const createSession = (title?: string): Promise<Session> => {
  return APIService.post<Session>("/api/ai/sessions", { title });
};

// update an existing session's metadata
export const updateSession = (
  sessionId: string,
  data: { title?: string; is_pinned?: boolean },
): Promise<Session> => {
  return APIService.patch<Session>(`/api/ai/sessions/${sessionId}`, data);
};

// delete a session by id
// export const deleteSession = (sessionId: string): Promise<void> => {
//   return APIService.delete(`/api/ai/sessions/${sessionId}`);
// };

// retrieve chat history for a session
export const getSessionMessages = (sessionId: string): Promise<SessionMessageResponse> => {
  return APIService.get(`/api/ai/sessions/${sessionId}`);
};
