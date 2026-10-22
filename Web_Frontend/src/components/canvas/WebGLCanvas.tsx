import React, { useEffect, useRef } from 'react';
import { SceneManager } from './scene/sceneManager';
import { HotspotsOverlay } from '../hud/HotspotsOverlay';
import { useModal } from '../../context/ModalContext';
import { useTheme } from '../../context/ThemeContext';

export const WebGLCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const managerRef = useRef<SceneManager | null>(null);
  const { activeModal, openModal } = useModal();
  const { isLight } = useTheme();

  const openModalRef = useRef(openModal);
  openModalRef.current = openModal;

  useEffect(() => {
    if (!canvasRef.current) return;

    const manager = new SceneManager({
      canvas: canvasRef.current,
      onSelectModal: key => {
        if (key === 'game') {
          manager.triggerEasterEggZoom(() => {
            openModalRef.current('game');
          });
        } else {
          openModalRef.current(key);
        }
      }
    });

    managerRef.current = manager;
    manager.setThemeMode(isLight);
    manager.startAnimation();

    const handleZoomEvent = () => {
      manager.triggerEasterEggZoom(() => {
        openModalRef.current('game');
      });
    };
    window.addEventListener('trigger-easter-egg-zoom', handleZoomEvent);

    return () => {
      window.removeEventListener('trigger-easter-egg-zoom', handleZoomEvent);
      manager.destroy();
      managerRef.current = null;
    };
  }, []);

  // Sincronizar Modo Claro / Modo Halloween con la escena 3D en tiempo real
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setThemeMode(isLight);
    }
  }, [isLight]);

  // Congelar posición del personaje y cámara al abrir o cerrar modales para evitar saltos
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setModalOpen(Boolean(activeModal));
    }
  }, [activeModal]);

  return (
    <>
      <canvas id="webgl-canvas" ref={canvasRef} />
      <div className={`vignette-overlay ${isLight ? 'light' : ''}`} />
      <HotspotsOverlay />
    </>
  );
};
