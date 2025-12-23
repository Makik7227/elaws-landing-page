export type Tier = "free" | "plus" | "premium";

const STORAGE_PREFIX = "elaws:monetization";
const TOKEN_WARNING_THRESHOLD = 0.8;
const NOTE_LIMITS: Record<Tier, number | null> = {
    free: 5,
    plus: 50,
    premium: null,
};
const DOCUMENT_LIMITS: Record<Tier, number | null> = {
    free: 0,
    plus: 5,
    premium: null,
};

const monthStamp = () => {
    const date = new Date();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${date.getUTCFullYear()}-${month}`;
};

const safeGetNumber = (key: string) => {
    if (typeof window === "undefined") return 0;
    try {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? Number(raw) : 0;
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
        return 0;
    }
};

const safeSetNumber = (key: string, value: number) => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, String(Math.max(0, value)));
    } catch {
        // ignore quota errors gracefully
    }
};

const safeFlagGet = (key: string) => {
    if (typeof window === "undefined") return false;
    try {
        return window.localStorage.getItem(key) === "1";
    } catch {
        return false;
    }
};

const safeFlagSet = (key: string) => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, "1");
    } catch {
        // ignore
    }
};

const monthlyKey = (feature: string, uid?: string | null) =>
    `${STORAGE_PREFIX}:${feature}:${uid ?? "anon"}:${monthStamp()}`;

const panicKey = (uid?: string | null) => `${STORAGE_PREFIX}:panic:${uid ?? "anon"}`;

export const getNoteLimit = (tier?: Tier | null) => NOTE_LIMITS[tier ?? "free"];
export const getDocumentLimit = (tier?: Tier | null) => DOCUMENT_LIMITS[tier ?? "free"];
export const getDocumentRunsThisMonth = (uid?: string | null) => safeGetNumber(monthlyKey("docs", uid));
export const incrementDocumentRunsThisMonth = (uid?: string | null) => {
    const key = monthlyKey("docs", uid);
    const next = safeGetNumber(key) + 1;
    safeSetNumber(key, next);
    return next;
};

export const hasUsedFreePanic = (uid?: string | null) => safeFlagGet(panicKey(uid));
export const markFreePanicUsed = (uid?: string | null) => {
    safeFlagSet(panicKey(uid));
};

export const canCreateCase = (tier?: Tier | null) => (tier ?? "free") === "premium";
export const canTriggerPanic = (tier?: Tier | null, panicUsed = false) =>
    (tier ?? "free") !== "free" || !panicUsed;
export const canGenerateDocument = (tier?: Tier | null, runsThisMonth = 0) => {
    const limit = getDocumentLimit(tier);
    if (limit === null) return true;
    return runsThisMonth < limit;
};

export const shouldWarnAboutTokens = (tokensUsed?: number, tokenLimit?: number) => {
    if (!tokenLimit || tokenLimit <= 0 || typeof tokensUsed !== "number") return false;
    return tokensUsed / tokenLimit >= TOKEN_WARNING_THRESHOLD;
};

export const remainingDocumentRuns = (tier?: Tier | null, runsThisMonth = 0) => {
    const limit = getDocumentLimit(tier);
    if (limit === null) return Infinity;
    return Math.max(0, limit - runsThisMonth);
};

export const shouldLockNotes = (tier?: Tier | null, existingCount = 0) => {
    const limit = getNoteLimit(tier);
    if (limit === null) return false;
    return existingCount >= limit;
};

const TIER_RANK: Record<Tier, number> = {
    free: 0,
    plus: 1,
    premium: 2,
};

export const isTierAtLeast = (tier?: Tier | null, required: Tier | "free" = "free") =>
    TIER_RANK[tier ?? "free"] >= TIER_RANK[required];
