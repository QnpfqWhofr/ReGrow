import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

type GameState = {
	coins: number;
	level: number;
	progressPct: number; // 0~100
	lastCollectAt: number | null;
	treesGrown: number;
};

type GameContextValue = GameState & {
	addCoins: (amount: number) => void;
	waterTree: () => void;
	fertilizeTree: () => void;
	reset: () => void;
	loading: boolean;
	showCongratulations: boolean;
	dismissCongratulations: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

const STORAGE_KEY = "regrow.game.v1";
const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

function loadInitial(): GameState {
	// 비로그인 시 항상 기본값 반환 (로컬 스토리지 무시)
	return { coins: 0, level: 1, progressPct: 0, lastCollectAt: null, treesGrown: 0 };
}

function persist(state: GameState) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {}
}

async function fetchGameFromServer(): Promise<GameState | null> {
	try {
		const res = await fetch(`${API_BASE}/auth/me`, {
			credentials: "include",
		});
		const data = await res.json();
		if (res.ok && data.ok && data.user) {
			return {
				coins: data.user.gameCoins ?? 200,
				level: data.user.gameLevel ?? 1,
				progressPct: data.user.gameProgressPct ?? 0,
				lastCollectAt: data.user.gameLastCollectAt ?? null,
				treesGrown: data.user.gameTreesGrown ?? 0,
			};
		}
	} catch {}
	return null;
}

async function saveGameToServer(state: GameState): Promise<boolean> {
	try {
		const res = await fetch(`${API_BASE}/auth/game`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				coins: state.coins,
				level: state.level,
				progressPct: state.progressPct,
				lastCollectAt: state.lastCollectAt,
				treesGrown: state.treesGrown,
			}),
		});
		const data = await res.json();
		return res.ok && data.ok === true;
	} catch {
		return false;
	}
}

export function GameProvider({ children }: { children: React.ReactNode }) {
	const { user, loading: authLoading } = useAuth();
	const [state, setState] = useState<GameState>(() => loadInitial());
	const [loading, setLoading] = useState(true);
	const [showCongratulations, setShowCongratulations] = useState(false);

	// 로그인 상태에 따라 서버에서 게임 정보 로드
	useEffect(() => {
		if (authLoading) return;

		let alive = true;
		(async () => {
			if (user) {
				// 로그인한 경우: 서버에서 로드
				setLoading(true);
				const serverState = await fetchGameFromServer();
				if (alive && serverState) {
					setState(serverState);
					persist(serverState); // 로컬에도 백업
				}
				setLoading(false);
			} else {
				// 비로그인: 항상 기본값 (레벨 1, 프로그레스 0, 코인 0)
				const defaultState = { coins: 0, level: 1, progressPct: 0, lastCollectAt: null, treesGrown: 0 };
				setState(defaultState);
				setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, [user, authLoading]);

	// 상태 변경 시 저장 (로그인한 경우 서버에만 저장, 비로그인은 저장하지 않음)
	useEffect(() => {
		if (loading || authLoading) return;
		if (user) {
			// 로그인한 경우: 서버에 저장하고 로컬에도 백업
			persist(state);
			const timer = setTimeout(() => {
				saveGameToServer(state).catch(() => {});
			}, 500);
			return () => clearTimeout(timer);
		}
		// 비로그인: 저장하지 않음 (항상 기본값 유지)
	}, [state, user, loading, authLoading]);

	const addCoins = useCallback((amount: number) => {
		setState((prev) => ({ ...prev, coins: Math.max(0, prev.coins + amount) }));
	}, []);

	const gainProgress = useCallback((amountPct: number) => {
		setState((prev) => {
			const nextPct = Math.min(100, prev.progressPct + amountPct);
			let level = prev.level;
			let progressPct = nextPct;
			let treesGrown = prev.treesGrown;
			
			if (nextPct >= 100) {
				level = prev.level + 1;
				progressPct = 0;
				
				// 레벨 4 달성 시 축하 팝업 표시 및 리셋
				if (level >= 4) {
					setShowCongratulations(true);
					treesGrown = prev.treesGrown + 1;
					level = 1;
					progressPct = 0;
				}
			}
			return { ...prev, level, progressPct, treesGrown };
		});
	}, []);



	const waterTree = useCallback(() => {
		if (state.coins < 5) {
			alert("코인이 부족합니다.");
			return;
		}
		addCoins(-5);
		gainProgress(10);
	}, [state.coins, addCoins, gainProgress]);

	const fertilizeTree = useCallback(() => {
		if (state.coins < 10) {
			alert("코인이 부족합니다.");
			return;
		}
		addCoins(-10);
		gainProgress(20);
	}, [state.coins, addCoins, gainProgress]);

	const reset = useCallback(() => {
		const next = { coins: 200, level: 1, progressPct: 0, lastCollectAt: null, treesGrown: 0 };
		setState(next);
		persist(next);
	}, []);

	const dismissCongratulations = useCallback(() => {
		setShowCongratulations(false);
	}, []);

	// LEVEL-UP 보정: progressPct가 100을 넘는 상태를 한 번에 처리
	useEffect(() => {
		if (state.progressPct >= 100) {
			setState((prev) => ({
				...prev,
				level: prev.level + 1,
				progressPct: 0,
			}));
		}
	}, [state.progressPct]);

	const value = useMemo<GameContextValue>(
		() => ({
			...state,
			addCoins,
			waterTree,
			fertilizeTree,
			reset,
			loading,
			showCongratulations,
			dismissCongratulations,
		}),
		[state, addCoins, waterTree, fertilizeTree, reset, loading, showCongratulations, dismissCongratulations]
	);

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
	const ctx = useContext(GameContext);
	if (!ctx) throw new Error("useGame must be used within GameProvider");
	return ctx;
}


