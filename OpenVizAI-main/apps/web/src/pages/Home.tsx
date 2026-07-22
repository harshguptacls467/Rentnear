import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/auth/useCurrentUser";
import { useSessions } from "../hooks/session/useSessions";
import { useGenerateAnswer } from "../hooks/ai/useGenerateAnswer";
import type { GenerateAnswerRequest } from "../hooks/ai/useGenerateAnswer";
import { removeLocalStorageItem } from "../utils/storage";
import { STORAGE_KEYS } from "../constants/storage";
import "./Home.css";

import SessionSidebar from "../components/Home/SessionSideBar";
import ChartPlayground from "../components/Home/ChartPlayground";
import { useEffect } from "react";
import { useSessionMessages } from "../hooks/session/useSessionMessages";
import { useChartState } from "../context/chartContext";

export default function Home() {
  const { data: user } = useCurrentUser();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const { setRows, setPrompt, setDataInput, setChartResult } = useChartState();

  const navigate = useNavigate();
  const generateAnswerMutation = useGenerateAnswer();
  const sessionMessagesMutation = useSessionMessages();
  useEffect(() => {
    if (generateAnswerMutation.data) {
      setChartResult(generateAnswerMutation.data.result);
    }
  }, [generateAnswerMutation.data]);

  const handleSessionClick = (sessionId: string) => {
    sessionMessagesMutation.mutate(sessionId, {
      onSuccess: (response) => {
        try {
          const messages = response.messages;

          const human = messages.find((m) => m.message.type === "human");
          const ai = messages.find((m) => m.message.type === "ai");

          if (!human || !ai) return;

          const prompt = human.message.content;
          const rawData = human.message.additional_kwargs?.data;

          let data: Record<string, unknown>[] = [];
          if (typeof rawData === "string") {
            try {
              data = JSON.parse(rawData);
            } catch {
              data = [];
            }
          } else if (Array.isArray(rawData)) {
            data = rawData;
          }

          setPrompt(prompt);
          setDataInput(JSON.stringify(data, null, 2));
          setRows(data);

          const meta = ai.message.response_metadata?.meta;
          const chart = ai.message.response_metadata?.chart;

          if (meta && chart) {
            setChartResult({
              meta,
              chart,
              response_type: "graphical",
            });
          }
        } catch {
          // Silently handle malformed session data
        }
      },
    });
  };

  const handleLogout = () => {
    removeLocalStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
    removeLocalStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
    navigate("/login");
  };

  const handleGenerate = ({
    prompt,
    data,
    sessionId,
    dashboardMode,
    maxCharts,
    charts,
  }: GenerateAnswerRequest) => {
    generateAnswerMutation.mutate({
      prompt,
      data,
      sessionId,
      dashboardMode,
      maxCharts,
      charts,
    });
  };

  return (
    <div className="home-container">
      <header className="home-topbar">
        <div className="home-topbar-inner">
          <span className="home-brand">OpenVizAI</span>
          <div className="home-user-email">{user?.email}</div>
          {user && (
            <button
              className="btn btn-outline-light btn-sm home-logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </header>

      <div className="container-fluid px-3 px-md-4 home-content-wrap">
        <div className="row g-4">
          <SessionSidebar
            sessions={sessions}
            loading={sessionsLoading}
            onSelectSession={handleSessionClick}
          />

          <ChartPlayground
            onGenerate={handleGenerate}
            loading={generateAnswerMutation.status === "pending"}
            error={(generateAnswerMutation.error as Error)?.message}
          />
        </div>
      </div>
    </div>
  );
}
