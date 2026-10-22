import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { getHealth, getMe, isAuthError, loginBasic } from "../lib/api";

export function LoginPage() {
	const navigate = useNavigate();
	const [username, setUsername] = useState("admin");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [checkingSession, setCheckingSession] = useState(true);
	const [deploymentMode, setDeploymentMode] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function init() {
			try {
				const health = await getHealth();
				if (cancelled) return;
				setDeploymentMode(health.deploymentMode);

				if (health.deploymentMode === "managed") {
					window.location.href = "/slack/oauth/install";
					return;
				}
			} catch {
				if (!cancelled) setDeploymentMode("selfhosted");
			}

			try {
				await getMe();
				if (!cancelled) navigate("/dashboard", { replace: true });
			} catch (err) {
				if (!cancelled && !isAuthError(err)) {
					setError("Could not reach the bot API. Is the bot running on port 3001?");
				}
			} finally {
				if (!cancelled) setCheckingSession(false);
			}
		}

		init();
		return () => {
			cancelled = true;
		};
	}, [navigate]);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			await loginBasic(username.trim(), password);
			navigate("/dashboard", { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setSubmitting(false);
		}
	}

	if (checkingSession && deploymentMode !== "managed") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#fafcfd]">
				<p className="text-sm text-[#6b7080]">Checking session…</p>
			</div>
		);
	}

	if (deploymentMode === "managed") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#fafcfd]">
				<p className="text-sm text-[#6b7080]">Redirecting to Slack sign-in…</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-[#fafcfd] px-4">
			<div className="mb-8 flex items-center gap-2.5">
				<img src="/openviktor.png" alt="OpenViktor" className="h-10 w-10" />
				<span
					className="text-xl font-bold tracking-[0.1em] text-[#111]"
					style={{ fontFamily: "'Manrope', sans-serif" }}
				>
					OPENVIKTOR
				</span>
			</div>

			<Card className="w-full max-w-sm border-[#d6eaef] shadow-md">
				<h1 className="mb-1 text-lg font-semibold text-slate-900">Admin sign in</h1>
				<p className="mb-6 text-sm text-slate-500">
					Use the dashboard credentials from your <code className="text-xs">.env</code> file.
				</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
							Username
						</label>
						<input
							id="username"
							name="username"
							type="text"
							autoComplete="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1e6a8a] focus:ring-1 focus:ring-[#1e6a8a]"
							required
						/>
					</div>
					<div>
						<label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
							Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1e6a8a] focus:ring-1 focus:ring-[#1e6a8a]"
							required
						/>
					</div>

					{error && (
						<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={submitting}
						className="w-full rounded-lg bg-[#111] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{submitting ? "Signing in…" : "Sign in"}
					</button>
				</form>
			</Card>
		</div>
	);
}
