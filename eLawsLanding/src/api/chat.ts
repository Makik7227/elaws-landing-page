import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "../../firebase";

export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
export async function sendMessageToGPT(
    history: { role: "system" | "user" | "assistant"; content: string }[]
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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4.1",
            messages: history,
            temperature: 0.3,
        }),
    });

    const data = await response.json();
    const outputContent = data?.choices?.[0]?.message?.content?.trim();

    if (!outputContent) {
        console.error("OpenAI error:", data);
        return {
            content: "Sorry, something went wrong. Please try again.",
            tokensUsed: 0,
        };
    }
    const outputTokens = estimateTokens(outputContent);
    const totalTokens = inputTokens + outputTokens;

    await updateDoc(userRef, {
        monthlyTokensUsed: increment(totalTokens),
    });

    return {
        content: outputContent,
        tokensUsed: totalTokens,
    };
}
