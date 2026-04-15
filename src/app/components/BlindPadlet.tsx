import { useState, useEffect } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Lock, Eye, EyeOff, Trash2, LogOut, Edit3 } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface Response {
  id: string;
  text: string;
  authorName: string;
  authorId: string;
  timestamp: number;
}

interface BlindPadletProps {
  sessionId: string;
  userId: string;
  userName: string;
  supabase: SupabaseClient;
  onLeave: () => void;
}

export function BlindPadlet({
  sessionId,
  userId,
  userName,
  supabase,
  onLeave,
}: BlindPadletProps) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [promptText, setPromptText] = useState("Share your thoughts...");
  const [inputText, setInputText] = useState("");
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [tempPrompt, setTempPrompt] = useState("");

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-85692d7a`;

  // Fetch session data
  const fetchSessionData = async () => {
    try {
      const response = await fetch(`${serverUrl}/session/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });
      const data = await response.json();
      
      console.log("Fetched session data:", data);
      console.log("Responses type:", typeof data.responses);
      console.log("Responses value:", data.responses);
      console.log("Current userId:", userId);
      console.log("Creator ID from server:", data.creatorId);
      console.log("Is creator check:", data.creatorId === userId);
      
      if (data.error) {
        console.error("Error fetching session data:", data);
        return;
      }

      let finalPrompt = data.prompt || "Share your thoughts...";
      let finalResponses = data.responses || [];

      // Fix: Check if prompt contains JSON array (responses got stored in wrong field)
      if (typeof finalPrompt === 'string' && finalPrompt.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(finalPrompt);
          if (Array.isArray(parsed)) {
            console.log("Detected responses in prompt field, swapping...");
            finalResponses = parsed;
            finalPrompt = "Share your thoughts...";
          }
        } catch (e) {
          // Not JSON, keep as is
        }
      }

      setPromptText(finalPrompt);
      setRevealed(data.revealed);
      setIsCreator(data.creatorId === userId);
      
      // Ensure responses is an array
      if (Array.isArray(finalResponses)) {
        console.log("Setting responses as array:", finalResponses);
        setResponses(finalResponses);
      } else if (typeof finalResponses === 'string') {
        // If it's a string, parse it
        try {
          const parsed = JSON.parse(finalResponses);
          console.log("Parsed responses:", parsed);
          setResponses(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.error("Failed to parse responses:", e);
          setResponses([]);
        }
      } else {
        console.log("Responses is neither array nor string, setting empty");
        setResponses([]);
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
    }
  };

  // Poll for updates every 2 seconds
  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(fetchSessionData, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const myResponse = responses.find((r) => r.authorId === userId);
  const hasSubmitted = !!myResponse;

  const submitResponse = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    try {
      const response = await fetch(`${serverUrl}/session/${sessionId}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          userId,
          userName,
          text: trimmed,
        }),
      });

      const data = await response.json();
      if (data.error) {
        console.error("Error submitting response:", data);
        return;
      }

      setInputText("");
      await fetchSessionData();
    } catch (error) {
      console.error("Error submitting response:", error);
    }
  };

  const deleteMyResponse = async () => {
    try {
      const response = await fetch(
        `${serverUrl}/session/${sessionId}/response/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      if (data.error) {
        console.error("Error deleting response:", data);
        return;
      }

      await fetchSessionData();
    } catch (error) {
      console.error("Error deleting response:", error);
    }
  };

  const toggleReveal = async () => {
    try {
      const response = await fetch(`${serverUrl}/session/${sessionId}/reveal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ revealed: !revealed, userId }),
      });

      const data = await response.json();
      if (data.error) {
        console.error("Error toggling reveal:", data);
        alert(data.error);
        return;
      }

      await fetchSessionData();
    } catch (error) {
      console.error("Error toggling reveal:", error);
    }
  };

  const updatePrompt = async () => {
    if (!tempPrompt.trim()) return;

    try {
      const response = await fetch(`${serverUrl}/session/${sessionId}/prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ prompt: tempPrompt }),
      });

      const data = await response.json();
      if (data.error) {
        console.error("Error updating prompt:", data);
        return;
      }

      setIsEditingPrompt(false);
      await fetchSessionData();
    } catch (error) {
      console.error("Error updating prompt:", error);
    }
  };

  const clearAll = async () => {
    if (!confirm("Clear all responses? This cannot be undone.")) return;

    try {
      const response = await fetch(`${serverUrl}/session/${sessionId}/clear`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      const data = await response.json();
      if (data.error) {
        console.error("Error clearing session:", data);
        return;
      }

      await fetchSessionData();
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  const visibleResponses = revealed
    ? responses
    : responses.filter((r) => r.authorId === userId);

  const hiddenCount = responses.length - (hasSubmitted ? 1 : 0);

  return (
    <div className="w-full max-w-2xl bg-gradient-to-b from-purple-50 to-white rounded-2xl shadow-2xl overflow-hidden border border-purple-200">
      {/* Header */}
      <div className="bg-purple-600 text-white px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <h1 className="text-xl font-bold">Hidden Response</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              {responses.length} {responses.length === 1 ? "response" : "responses"}
            </div>
            <button
              onClick={onLeave}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Leave session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editable Prompt (Creator Only) */}
        <div className="bg-white rounded-lg p-3">
          <div className="text-xs text-purple-600 mb-2 font-semibold">
            {isCreator ? "📝 PROMPT (Click to edit)" : "📝 PROMPT"}
          </div>
          {isCreator ? (
            isEditingPrompt ? (
              <div className="space-y-2">
                <textarea
                  value={tempPrompt}
                  onChange={(e) => setTempPrompt(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900 font-medium outline-none border-2 border-purple-400 focus:border-purple-600 resize-none"
                  placeholder="Enter your prompt here..."
                  autoFocus
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsEditingPrompt(false);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={updatePrompt}
                    className="px-5 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold text-white"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingPrompt(false)}
                    className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempPrompt(promptText);
                  setIsEditingPrompt(true);
                }}
                className="w-full text-left px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors group border-2 border-purple-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-medium whitespace-pre-wrap">{promptText}</span>
                  <Edit3 className="w-4 h-4 text-purple-600 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                </div>
              </button>
            )
          ) : (
            <div className="px-4 py-3 rounded-lg bg-purple-50 border-2 border-purple-200">
              <span className="text-gray-900 font-medium whitespace-pre-wrap">{promptText}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div
        className={`px-6 py-3 flex items-center gap-2 text-sm ${
          revealed ? "bg-green-50 text-green-700" : "bg-purple-100 text-purple-700"
        }`}
      >
        {revealed ? (
          <>
            <Eye className="w-4 h-4" />
            <span>✅ Responses are visible to everyone</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>
              🔒 Responses hidden —{" "}
              {hiddenCount > 0
                ? `${hiddenCount} submitted by others`
                : "none submitted yet"}
            </span>
          </>
        )}
      </div>

      {/* Session ID */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Session ID:</span>{" "}
          <code className="bg-white px-2 py-1 rounded border border-gray-200">
            {sessionId}
          </code>
        </div>
      </div>

      {/* Input Area */}
      <div className="px-6 py-5 bg-white border-b border-gray-200">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          {hasSubmitted ? `✏️ Update your response (${userName})` : `📝 Your response (${userName})`}
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your response here..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
          rows={3}
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={submitResponse}
            disabled={!inputText.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {hasSubmitted ? "Update" : "Submit"}
          </button>
          {hasSubmitted && (
            <button
              onClick={deleteMyResponse}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-300 rounded-lg hover:bg-red-100 transition-colors text-sm flex items-center gap-2"
            >
              Remove mine
            </button>
          )}
        </div>
      </div>

      {/* Responses Area */}
      <div className="px-6 py-5 max-h-96 overflow-y-auto">
        {visibleResponses.length === 0 && !revealed && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🤫</div>
            <p className="text-sm text-gray-600">
              {hasSubmitted
                ? "Your response is saved.\nWaiting for the host to reveal all responses."
                : "No responses yet. Be the first!"}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {visibleResponses.map((r) => (
            <div
              key={r.id}
              className={`p-4 rounded-lg border-2 shadow-sm ${
                r.authorId === userId
                  ? "bg-purple-50 border-purple-300"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-semibold ${
                    r.authorId === userId ? "text-purple-700" : "text-gray-600"
                  }`}
                >
                  👤 {r.authorName}
                  {r.authorId === userId && " (you)"}
                </span>
              </div>
              <p className="text-sm text-gray-800">{r.text}</p>
            </div>
          ))}

          {/* Hidden response placeholders */}
          {!revealed &&
            responses
              .filter((r) => r.authorId !== userId)
              .map((r) => (
                <div
                  key={`hidden-${r.id}`}
                  className="p-4 rounded-lg bg-purple-100 border-2 border-purple-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-700">
                      Hidden response
                    </span>
                  </div>
                  <p className="text-sm text-purple-400">••••••••••••••••••</p>
                </div>
              ))}
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
        {isCreator ? (
          <>
            <button
              onClick={toggleReveal}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 ${
                revealed
                  ? "bg-red-50 text-red-600 border-2 border-red-300 hover:bg-red-100"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {revealed ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  🙈 Hide All Responses
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  👁 Reveal All Responses
                </>
              )}
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center gap-2"
              title="Clear all responses"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex-1 px-6 py-3 text-center text-sm text-gray-600 italic">
            ⏳ Only the session creator can reveal responses
          </div>
        )}
      </div>
    </div>
  );
}