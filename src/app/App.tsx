import { useState, useEffect } from "react";
import { BlindPadlet } from "./components/BlindPadlet";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Play, Users, MessageSquare, Eye, Lock } from "lucide-react";
import { supabase } from "./lib/supabase";
import { WidgetGrid } from '../guidelines/WidgetGrid'
import { Sidebar } from '../guidelines/Sidebar'
import { Header } from '../guidelines/Header'
import { Widget } from '../guidelines/Widget'

export default function App() {
  const [sessionId, setSessionId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isJoined, setIsJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showCover, setShowCover] = useState(true);

  useEffect(() => {
    // Generate a unique user ID if not exists
    const storedUserId = localStorage.getItem("blindPadletUserId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = `user-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem("blindPadletUserId", newUserId);
      setUserId(newUserId);
    }
  }, []);

  const handleJoinSession = () => {
    if (sessionId.trim() && userName.trim()) {
      setIsJoined(true);
    }
  };

  const handleCreateSession = async () => {
    if (!userName.trim()) {
      alert("Please enter your name first");
      return;
    }
    
    if (!userId) {
      alert("User ID not ready. Please try again.");
      return;
    }
    
    const newSessionId = Math.floor(1000 + Math.random() * 9000).toString();
    
    console.log("Creating session with userId:", userId);
    
    // Initialize the session with this user as creator
    const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-85692d7a`;
    try {
      const response = await fetch(`${serverUrl}/session/${newSessionId}/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ creatorId: userId }),
      });
      
      const result = await response.json();
      console.log("Init response:", result);
      
      if (response.ok) {
        setSessionId(newSessionId);
        setIsCreator(true);
        setIsJoined(true); // Automatically join after creating
      } else {
        console.error('Error initializing session:', result);
        alert('Failed to create session. Please try again.');
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      alert('Failed to create session. Please try again.');
    }
  };

  if (showCover) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center p-4 overflow-hidden relative">
        {/* Floating animated icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
            <Users className="w-16 h-16 text-white opacity-20" />
          </div>
          <div className="absolute top-40 right-32 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>
            <MessageSquare className="w-20 h-20 text-white opacity-20" />
          </div>
          <div className="absolute bottom-32 left-40 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}>
            <Eye className="w-14 h-14 text-white opacity-20" />
          </div>
          <div className="absolute bottom-20 right-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4s' }}>
            <Lock className="w-12 h-12 text-white opacity-20" />
          </div>
          <div className="absolute top-1/2 left-10 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3s' }}>
            <MessageSquare className="w-10 h-10 text-white opacity-20" />
          </div>
          <div className="absolute top-1/3 right-10 animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '3.5s' }}>
            <Users className="w-12 h-12 text-white opacity-20" />
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center max-w-2xl">
          {/* Icon grid */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="bg-white bg-opacity-20 backdrop-blur-lg p-4 rounded-2xl transform hover:scale-110 transition-transform">
              <Users className="w-12 h-12 text-white" />
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-lg p-4 rounded-2xl transform hover:scale-110 transition-transform">
              <MessageSquare className="w-12 h-12 text-white" />
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-lg p-4 rounded-2xl transform hover:scale-110 transition-transform">
              <Eye className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl">
            Collaboration Pad
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white text-opacity-90 mb-8 font-medium drop-shadow-lg">
            Collect hidden responses, reveal together ✨
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <div className="bg-white bg-opacity-20 backdrop-blur-md px-4 py-2 rounded-full text-white font-medium flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Private Responses</span>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-md px-4 py-2 rounded-full text-white font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Real-time Collaboration</span>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-md px-4 py-2 rounded-full text-white font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>Simultaneous Reveal</span>
            </div>
          </div>

          {/* Play button */}
          <button
            onClick={() => setShowCover(false)}
            className="group bg-white text-purple-600 px-12 py-5 rounded-full text-2xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center gap-4 mx-auto"
          >
            <Play className="w-8 h-8 fill-current" />
            <span>Start</span>
          </button>

          {/* Decorative elements */}
          <div className="mt-12 text-white text-opacity-70 text-sm">
            <p>💬 Share prompts • 🔒 Collect responses • 👁️ Reveal together</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">💬</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Hidden Response</h1>
            <p className="text-gray-600">Collect responses anonymously, reveal together</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter session ID"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleCreateSession}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  New
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this ID with others to collaborate
              </p>
            </div>

            <button
              onClick={handleJoinSession}
              disabled={!sessionId.trim() || !userName.trim()}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Join Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <BlindPadlet
        sessionId={sessionId}
        userId={userId}
        userName={userName}
        supabase={supabase}
        onLeave={() => setIsJoined(false)}
      />
    </div>
  );
}
