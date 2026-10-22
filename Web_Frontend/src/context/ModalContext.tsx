import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { ModalKey } from '../types/common';

interface ModalContextType {
  activeModal: ModalKey | null;
  modalParam?: string;
  openModal: (key: ModalKey, param?: string) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
  const [modalParam, setModalParam] = useState<string | undefined>(undefined);

  const openModal = useCallback((key: ModalKey, param?: string) => {
    setActiveModal(key);
    setModalParam(param);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalParam(undefined);
  }, []);

  const value = useMemo(
    () => ({
      activeModal,
      modalParam,
      openModal,
      closeModal
    }),
    [activeModal, modalParam, openModal, closeModal]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal debe usarse dentro de ModalProvider');
  }
  return context;
};

