import { useState, type FC } from "react";

interface Session {
  session_id: string;
  title: string;
}

interface Props {
  sessions?: Session[];
  loading: boolean;
  onSelectSession: (sessionId: string) => void;
}

const SessionSidebar: FC<Props> = ({ sessions, loading, onSelectSession }) => {
  const [activeSession, setActiveSession] = useState<string | null>(null);

  return (
    <aside className="col-12 col-md-4 col-lg-3 col-xl-2 mb-4 mb-lg-0">
      <div className="card h-100 home-card session-card">
        <div className="card-header fw-semibold session-card-header">
          <h6 className="mb-0">Your Sessions</h6>
        </div>

        <div className="card-body p-0 session-card-body">
          {loading && (
            <div className="p-3 text-center text-muted small">Loading...</div>
          )}

          {!loading && sessions && sessions.length === 0 && (
            <div className="p-3 text-center text-muted small">
              No sessions yet
            </div>
          )}

          {!loading && sessions && sessions.length > 0 && (
            <ul className="list-group list-group-flush overflow-auto session-list">
              {sessions.map((s) => (
                <li
                  key={s.session_id}
                  className={`list-group-item list-group-item-action d-flex align-items-center
              session-item ${activeSession === s.session_id ? "active" : ""}`}
                  role="button"
                  onClick={() => {
                    setActiveSession(s.session_id);
                    onSelectSession(s.session_id);
                  }}
                >
                  <small
                    className={
                      activeSession === s.session_id
                        ? "text-white text-truncate session-item-title"
                        : "text-muted text-truncate session-item-title"
                    }
                  >
                    {s.title}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
};

export default SessionSidebar;
