import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { TournamentProvider } from './context/TournamentContext';
import { ChatProvider } from './context/ChatContext';
import { ModalProvider } from './context/ModalContext';
import { ThemeProvider } from './context/ThemeContext';
import { WebGLCanvas } from './components/canvas/WebGLCanvas';
import { Navbar } from './components/hud/Navbar';
import { AltitudeHud } from './components/hud/AltitudeHud';
import { ScrollHint } from './components/hud/ScrollHint';
import { ModalRoot } from './components/modals/ModalRoot';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ClassificationPage } from './pages/classification/ClassificationPage';
import { PlayersPage } from './pages/players/PlayersPage';
import { RefereesPage } from './pages/referees/RefereesPage';
import { PumpkinChatbot } from './components/chatbot/PumpkinChatbot';
import { useHashRoute } from './hooks/useHashRoute';

export const App: React.FC = () => {
  const route = useHashRoute();

  return (
    <ThemeProvider>
      <AuthProvider>
        {route === 'register' ? (
          <RegisterPage />
        ) : route === 'login' ? (
          <LoginPage />
        ) : route === 'clasificacion' ? (
          <TournamentProvider>
            <ChatProvider>
              <ModalProvider>
                <Navbar />
                <ModalRoot />
                <ClassificationPage />
                <PumpkinChatbot />
              </ModalProvider>
            </ChatProvider>
          </TournamentProvider>
        ) : route === 'jugadores' ? (
          <TournamentProvider>
            <ChatProvider>
              <ModalProvider>
                <Navbar />
                <ModalRoot />
                <PlayersPage />
                <PumpkinChatbot />
              </ModalProvider>
            </ChatProvider>
          </TournamentProvider>
        ) : route === 'arbitros' ? (
          <TournamentProvider>
            <ChatProvider>
              <ModalProvider>
                <Navbar />
                <ModalRoot />
                <RefereesPage />
                <PumpkinChatbot />
              </ModalProvider>
            </ChatProvider>
          </TournamentProvider>
        ) : (
          <TournamentProvider>
            <ChatProvider>
              <ModalProvider>
                {/* 3D WebGL Canvas y overlays */}
                <WebGLCanvas />

                {/* HUD e interfaz flotante */}
                <Navbar />
                <AltitudeHud />
                <ScrollHint />

                {/* Ventanas modales interactivas */}
                <ModalRoot />

                {/* Chatbot Calabacín abajo a la derecha */}
                <PumpkinChatbot />

                {/* Contenedor de scroll para activar la navegación a lo largo de los 760vh */}
                <main className="scroll-container">
                  <div style={{ height: '760vh' }} />
                </main>
              </ModalProvider>
            </ChatProvider>
          </TournamentProvider>
        )}
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

