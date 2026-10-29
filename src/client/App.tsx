import React, { useState, useEffect, useCallback } from "react";
import { HomePage } from "./components/HomePage";
import { RoomView } from "./components/RoomView";
import { ProfileModal } from "./components/ProfileModal";
import { useUser } from "./hooks/useUser";

export const App: React.FC = () => {
  const { user, updateUser } = useUser();
  const [currentRoom, setCurrentRoom] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    return path ? path.toLowerCase() : null;
  });
  const [isGlobalProfileOpen, setIsGlobalProfileOpen] = useState(false);

  // Sync with browser history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
      setCurrentRoom(path ? path.toLowerCase() : null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToRoom = useCallback((room: string) => {
    const clean = room.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (clean) {
      window.history.pushState({}, "", `/${clean}`);
      setCurrentRoom(clean);
    }
  }, []);

  const navigateToHome = useCallback(() => {
    window.history.pushState({}, "", "/");
    setCurrentRoom(null);
    document.title = "Loopin - Ephemeral Real-Time Chat";
  }, []);

  return (
    <div className="app-root">
      {currentRoom ? (
        <RoomView
          roomId={currentRoom}
          currentUser={user}
          onUpdateUser={updateUser}
          onLeaveRoom={navigateToHome}
        />
      ) : (
        <HomePage
          onJoinRoom={navigateToRoom}
          currentUser={user}
          onUpdateUser={updateUser}
          onOpenProfile={() => setIsGlobalProfileOpen(true)}
        />
      )}

      {/* Global Profile Modal when accessed from Home */}
      <ProfileModal
        isOpen={isGlobalProfileOpen}
        onClose={() => setIsGlobalProfileOpen(false)}
        currentUser={user}
        onSave={(updates) => updateUser(updates)}
      />
    </div>
  );
};
