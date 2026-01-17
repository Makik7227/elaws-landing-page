import {doc, getDoc} from "firebase/firestore";
import {auth, db} from "../../firebase";

export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}
const FUNCTIONS_BASE_URL =
    import.meta.env.VITE_FUNCTIONS_BASE_URL ??
    "https://europe-central2-e-lawyer-a3055.cloudfunctions.net";

export async function sendMessageToGPT(
    history: { role: "system" | "user" | "assistant"; content: string }[],
    options: { model?: string } = {}
): Promise<{ content: string; tokensUsed: number }> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const tokenLimit = userData?.tokenLimit || 0;
    const tokensUsed = userData?.monthlyTokensUsed || 0;

    const inputTokens = history.reduce(
        (sum, msg) => sum + estimateTokens(msg.content),
        0
    );

    if (tokensUsed + inputTokens > tokenLimit) {
        throw new Error("You have reached your monthly token limit.");
    }

    const idToken = await currentUser.getIdToken();
    const body: Record<string, unknown> = {messages: history};
    if (options.model) body.model = options.model;

    const response = await fetch(`${FUNCTIONS_BASE_URL}/chatCompletion`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
    });

    let data: any = null;
    try {
        data = await response.json();
    } catch (err) {
        console.error("Failed to parse chatCompletion response", err);
    }

    if (!response.ok) {
        const errorMessage = data?.error ?? "Failed to generate response.";
        throw new Error(errorMessage);
    }

    const outputContent =
        typeof data?.content === "string" ? data.content.trim() : data?.content;
    const totalTokens =
        typeof data?.tokensUsed === "number" ? data.tokensUsed : inputTokens;

    if (!outputContent) {
        console.error("OpenAI error:", data);
        throw new Error("Sorry, something went wrong. Please try again.");
    }

    return {
        content: outputContent,
        tokensUsed: totalTokens,
    };
}
