import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useLoginWithEmail } from "../hooks/auth/useLoginWithEmail";
import { useCurrentUser } from "../hooks/auth/useCurrentUser";

export default function Login() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const [email, setEmail] = useState("");

  const loginMutation = useLoginWithEmail();

  // if already logged in, send to home
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync(email);
      // redirect on success
      navigate("/");
    } catch (err) {
      // error handled by mutation (could display)
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-sm" style={{ width: "380px" }}>
        <div className="card-body">
          <h4 className="card-title mb-3">Login</h4>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={(loginMutation.status as any) === "pending"}
            >
              {(loginMutation.status as any) === "pending"
                ? "Logging in..."
                : "Login"}
            </button>

            {loginMutation.isError && (
              <div className="alert alert-danger mt-3">
                {(loginMutation.error as Error)?.message || "Login failed"}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
