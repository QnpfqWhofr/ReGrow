// src/pages/Signup.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import ML from '../assets/ReGrowlogo.png';

/* ------------------------------ API 유틸 ------------------------------ */
const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

/* ------------------------------ Signup ------------------------------ */
type Step = 0 | 1 | 2 | 3;

export default function Signup() {
  const navigate = useNavigate();

  // 단계
  const [step, setStep] = useState<Step>(0);

  // 약관
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAds, setAgreeAds] = useState(false);

  const canGoStep1 = useMemo(
    () => agreeAge && agreePrivacy,
    [agreeAge, agreePrivacy]
  );

  useEffect(() => {
    if (agreeAll) {
      setAgreeAge(true);
      setAgreePrivacy(true);
      setAgreeAds(true);
    }
  }, [agreeAll]);

  useEffect(() => {
    if (agreeAll && (!agreeAge || !agreePrivacy || !agreeAds))
      setAgreeAll(false);
  }, [agreeAge, agreePrivacy, agreeAds]);

  // 계정
  const [userId, setUserId] = useState("");
  const [pw, setPw] = useState("");
  const [pwCheck, setPwCheck] = useState("");

  const canGoStep2 = useMemo(
    () => userId.trim().length >= 3 && pw.length >= 4 && pw === pwCheck,
    [userId, pw, pwCheck]
  );

  // 이메일/코드
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  // 타이머
  const [timeLeft, setTimeLeft] = useState(180);
  useEffect(() => {
    if (step === 3 && timeLeft > 0) {
      const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(id);
    }
  }, [step, timeLeft]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(1, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 상태
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [signing, setSigning] = useState(false);
  const [verified, setVerified] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 액션
  const sendCode = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!email || !email.includes("@")) {
      setErr("올바른 이메일을 입력하세요.");
      return;
    }
    try {
      setSending(true);
      await request<{ ok: true; messageId: string }>("/auth/send-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setTimeLeft(180);
      setVerified(false);
      setMsg("인증코드를 전송했습니다. 메일함을 확인해 주세요.");
      setStep(3);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  }, [email]);

  const verifyCode = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!code.trim()) {
      setErr("인증코드를 입력하세요.");
      return;
    }
    try {
      setVerifying(true);
      const r = await request<{ ok: true; verified: boolean }>("/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      if (r.verified) {
        setVerified(true);
        setMsg("이메일 인증이 완료되었습니다. 회원가입을 진행하세요.");
      }
    } catch (e: any) {
      setVerified(false);
      setErr(e.message);
    } finally {
      setVerifying(false);
    }
  }, [email, code]);

  const doSignup = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!verified) {
      setErr("이메일 인증을 먼저 완료하세요.");
      return;
    }
    try {
      setSigning(true);
      await request<{ ok: true }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ userId, password: pw, email }),
      });
      alert("회원가입이 완료되었습니다! 로그인 화면으로 이동합니다.");
      navigate("/login");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSigning(false);
    }
  }, [verified, userId, pw, email, navigate]);

  const stepTitles = [
    "약관 동의",
    "계정 정보",
    "이메일 인증",
    "인증 완료"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="grid lg:grid-cols-5">
            {/* 왼쪽 사이드바 - 진행 상황 */}
            <div className="lg:col-span-2 bg-gradient-to-br from-green-400 via-green-500 to-green-600 p-8 lg:p-12">
              <div className="space-y-8">
                <div className="text-center lg:text-left">
                  <img src={ML} alt='ReGrow' className="h-16 mx-auto lg:mx-0 mb-6" />
                  <h1 className="text-3xl font-bold text-white mb-4">
                    ReGrow와 함께
                    <br />
                    시작하세요
                  </h1>
                  <p className="text-green-100 text-lg">
                    지속가능한 중고거래의 새로운 경험
                  </p>
                </div>

                {/* 진행 단계 */}
                <div className="space-y-4">
                  {stepTitles.map((title, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        index <= step 
                          ? "bg-white text-green-600" 
                          : "bg-white/20 text-white/60"
                      }`}>
                        {index < step ? "✓" : index + 1}
                      </div>
                      <span className={`font-medium transition-all ${
                        index <= step ? "text-white" : "text-white/60"
                      }`}>
                        {title}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-8 space-y-4">
                  <div className="flex items-center gap-3 text-white/90">
                    <span className="text-xl">🌱</span>
                    <span className="text-sm">친환경 중고거래</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <span className="text-xl">🔒</span>
                    <span className="text-sm">안전한 거래 보장</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <span className="text-xl">⚡</span>
                    <span className="text-sm">빠른 거래 매칭</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽 폼 영역 */}
            <div className="lg:col-span-3 p-8 lg:p-12">
              <div className="max-w-md mx-auto">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {stepTitles[step]}
                  </h2>
                  <p className="text-gray-600">
                    {step === 0 && "서비스 이용을 위한 약관에 동의해주세요"}
                    {step === 1 && "사용하실 계정 정보를 입력해주세요"}
                    {step === 2 && "이메일 인증을 진행해주세요"}
                    {step === 3 && "인증코드를 입력하고 가입을 완료하세요"}
                  </p>
                </div>

                {/* Step 0: 약관 */}
                {step === 0 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (canGoStep1) setStep(1);
                    }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          className="w-5 h-5 mt-0.5 text-green-600 rounded focus:ring-green-500"
                          checked={agreeAll}
                          onChange={(e) => setAgreeAll(e.target.checked)}
                        />
                        <div>
                          <div className="font-semibold text-gray-900">전체 동의</div>
                          <div className="text-sm text-gray-600">모든 약관에 동의합니다</div>
                        </div>
                      </label>

                      <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 mt-1 text-green-600 rounded focus:ring-green-500"
                            checked={agreeAge}
                            onChange={(e) => setAgreeAge(e.target.checked)}
                          />
                          <div className="flex-1">
                            <span className="text-gray-900">만 14세 이상입니다</span>
                            <span className="text-red-500 ml-1">(필수)</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 mt-1 text-green-600 rounded focus:ring-green-500"
                            checked={agreePrivacy}
                            onChange={(e) => setAgreePrivacy(e.target.checked)}
                          />
                          <div className="flex-1">
                            <span className="text-gray-900">개인정보 처리방침 동의</span>
                            <span className="text-red-500 ml-1">(필수)</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 mt-1 text-green-600 rounded focus:ring-green-500"
                            checked={agreeAds}
                            onChange={(e) => setAgreeAds(e.target.checked)}
                          />
                          <div className="flex-1">
                            <span className="text-gray-900">마케팅 정보 수신 동의</span>
                            <span className="text-gray-500 ml-1">(선택)</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!canGoStep1}
                      className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      다음 단계
                    </button>
                  </form>
                )}

                {/* Step 1: 계정 정보 */}
                {step === 1 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (canGoStep2) setStep(2);
                    }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          아이디
                        </label>
                        <input
                          type="text"
                          placeholder="아이디를 입력하세요 (3자 이상)"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          autoComplete="username"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          비밀번호
                        </label>
                        <input
                          type="password"
                          placeholder="비밀번호를 입력하세요 (4자 이상)"
                          value={pw}
                          onChange={(e) => setPw(e.target.value)}
                          autoComplete="new-password"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          비밀번호 확인
                        </label>
                        <input
                          type="password"
                          placeholder="비밀번호를 다시 입력하세요"
                          value={pwCheck}
                          onChange={(e) => setPwCheck(e.target.value)}
                          autoComplete="new-password"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                        />
                        {pw && pwCheck && pw !== pwCheck && (
                          <p className="mt-2 text-sm text-red-600">비밀번호가 일치하지 않습니다</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                      >
                        이전
                      </button>
                      <button
                        type="submit"
                        disabled={!canGoStep2}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        다음 단계
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 2: 이메일 입력 */}
                {step === 2 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendCode();
                    }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이메일 주소
                      </label>
                      <input
                        type="email"
                        placeholder="이메일을 입력하세요"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                      />
                    </div>

                    {msg && (
                      <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl">
                        {msg}
                      </div>
                    )}

                    {err && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                        {err}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                      >
                        이전
                      </button>
                      <button
                        type="submit"
                        disabled={sending || !email.includes("@")}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {sending ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            전송 중...
                          </div>
                        ) : (
                          "인증코드 전송"
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3: 인증코드 입력 */}
                {step === 3 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      doSignup();
                    }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이메일 주소
                      </label>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        인증코드
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="인증코드 6자리"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={verifyCode}
                          disabled={verifying || !code.trim()}
                          className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {verifying ? "확인중" : "확인"}
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500">
                          남은 시간: {formatTime(timeLeft)}
                        </span>
                        <button
                          type="button"
                          onClick={sendCode}
                          disabled={sending}
                          className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          재전송
                        </button>
                      </div>
                    </div>

                    {verified && (
                      <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        이메일 인증이 완료되었습니다
                      </div>
                    )}

                    {msg && !verified && (
                      <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl">
                        {msg}
                      </div>
                    )}

                    {err && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                        {err}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                      >
                        이전
                      </button>
                      <button
                        type="submit"
                        disabled={!verified || signing}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {signing ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            가입 중...
                          </div>
                        ) : (
                          "회원가입 완료"
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* 하단 링크 */}
                <div className="pt-6 text-center">
                  <span className="text-gray-500 text-sm">이미 계정이 있으신가요? </span>
                  <Link 
                    to="/login" 
                    className="text-green-600 font-semibold hover:text-green-700 transition-colors"
                  >
                    로그인
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}