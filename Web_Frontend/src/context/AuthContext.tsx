import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  LoginPayload,
  RegisterJugadorPayload,
  RegisterArbitroPayload,
  RegisterUsuarioPayload
} from '../types/user';
import { authService, RegisterResult } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isReferee: boolean;
  isStaff: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  registerJugador: (payload: RegisterJugadorPayload) => Promise<RegisterResult>;
  registerArbitro: (payload: RegisterArbitroPayload) => Promise<RegisterResult>;
  registerUsuario: (payload: RegisterUsuarioPayload) => Promise<RegisterResult>;
  updateAvatar: (file: File) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => authService.getCurrentSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    authService
      .init()
      .then(session => {
        if (alive) setUser(session);
      })
      .catch(() => {
        if (alive) setUser(authService.getCurrentSession());
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    const unsubscribe = authService.onAuthStateChange(session => {
      if (alive) setUser(session);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    const loggedUser = await authService.login(payload);
    setUser(loggedUser);
  };

  const registerJugador = async (payload: RegisterJugadorPayload): Promise<RegisterResult> => {
    const result = await authService.registerJugador(payload);
    if (!result.requiresEmailConfirmation) setUser(result.user);
    return result;
  };

  const registerArbitro = async (payload: RegisterArbitroPayload): Promise<RegisterResult> => {
    const result = await authService.registerArbitro(payload);
    if (!result.requiresEmailConfirmation) setUser(result.user);
    return result;
  };

  const registerUsuario = async (payload: RegisterUsuarioPayload): Promise<RegisterResult> => {
    const result = await authService.registerUsuario(payload);
    if (!result.requiresEmailConfirmation) setUser(result.user);
    return result;
  };

  const updateAvatar = async (file: File) => {
    const updated = await authService.updateAvatar(file);
    setUser(updated);
  };

  const refreshProfile = async () => {
    const session = await authService.init();
    if (session) setUser(session);
  };

  const logout = () => {
    void authService.logout();
    setUser(null);
  };

  const deleteAccount = async () => {
    if (!user) return;
    await authService.deleteAccount(user.id);
    setUser(null);
  };

  const isAdmin = user?.rol === 'admin';
  const isReferee = user?.rol === 'arbitro';
  const isStaff = isAdmin || isReferee;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isReferee,
        isStaff,
        login,
        registerJugador,
        registerArbitro,
        registerUsuario,
        updateAvatar,
        refreshProfile,
        logout,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
