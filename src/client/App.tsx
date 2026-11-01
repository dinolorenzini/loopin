import React, { useState, useEffect, useCallback } from "react";
import { HomePage } from "./components/HomePage";
import { RoomView } from "./components/RoomView";
import { useUser, isUserOnboarded } from "./hooks/useUser";
import { OnboardingModal } from "./components/OnboardingModal";
import { ConsentBanner } from "./components/ConsentBanner";
import { LegalModal, type LegalDocType } from "./components/LegalModal";

export const App: React.FC = () => {
  const { user, updateUser } = useUser();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => !isUserOnboarded());
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType>("privacy");
  const [currentRoom, setCurrentRoom] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    return path ? path.toLowerCase() : null;
  });

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
    document.title = "Loopin";
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
        />
      )}

      <OnboardingModal
        isOpen={isOnboardingOpen}
        currentUser={user}
        onSave={updateUser}
        onComplete={() => setIsOnboardingOpen(false)}
      />

      <ConsentBanner
        onOpenPrivacyPolicy={() => {
          setLegalDoc("privacy");
          setIsLegalOpen(true);
        }}
      />

      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialDoc={legalDoc}
      />
    </div>
  );
};
