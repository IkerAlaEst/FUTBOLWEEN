import React, { useEffect, ReactNode, useRef } from 'react';
import { X } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useTheme } from '../../context/ThemeContext';

interface ModalContainerProps {
  children: ReactNode;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({ children }) => {
  const { activeModal, closeModal } = useModal();
  const { theme } = useTheme();
  const savedScrollYRef = useRef<number>(0);

  // Bloquear rigurosamente el scroll del fondo mientras el modal está abierto sin tocar html.overflow
  useEffect(() => {
    if (activeModal) {
      (window as any).__isModalOpen = true;
      savedScrollYRef.current = window.scrollY;

      // Interceptar rueda y toque para impedir cualquier movimiento del fondo
      const preventBackgroundScroll = (e: WheelEvent | TouchEvent) => {
        const modalEl = document.getElementById('modal');
        if (!modalEl) {
          e.preventDefault();
          return;
        }

        // Si el puntero está fuera del modal, bloquear siempre el fondo
        if (!modalEl.contains(e.target as Node)) {
          e.preventDefault();
          return;
        }

        if (e instanceof WheelEvent) {
          // Buscar el contenedor con scroll más cercano al elemento donde está el puntero
          let current = e.target as HTMLElement | null;
          let scrollableEl: HTMLElement | null = null;

          while (current && current !== modalEl && current !== document.body) {
            const style = window.getComputedStyle(current);
            const canScrollY =
              (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
              current.scrollHeight > current.clientHeight;
            if (canScrollY) {
              scrollableEl = current;
              break;
            }
            current = current.parentElement;
          }

          if (scrollableEl) {
            const { scrollTop, scrollHeight, clientHeight } = scrollableEl;
            const isAtTop = scrollTop <= 0 && e.deltaY < 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;

            if (!isAtTop && !isAtBottom) {
              // El contenedor interno (como el chat o la lista) puede desplazarse libremente -> PERMITIR
              return;
            }

            // Si llegó al tope del contenedor interno, verificar si un ancestro (como .modal-content-area) puede desplazarse
            let parent = scrollableEl.parentElement;
            while (parent && parent !== modalEl) {
              const pStyle = window.getComputedStyle(parent);
              if (
                (pStyle.overflowY === 'auto' || pStyle.overflowY === 'scroll') &&
                parent.scrollHeight > parent.clientHeight
              ) {
                const pTop = parent.scrollTop <= 0 && e.deltaY < 0;
                const pBottom =
                  parent.scrollTop + parent.clientHeight >= parent.scrollHeight - 1 && e.deltaY > 0;
                if (!pTop && !pBottom) {
                  return; // El contenedor padre puede desplazarse
                }
              }
              parent = parent.parentElement;
            }
          }

          // Si ningún contenedor del modal puede desplazarse en esta dirección, bloquear para no mover la página de fondo
          e.preventDefault();
        } else if (e instanceof TouchEvent) {
          let current = e.target as HTMLElement | null;
          let isInsideScrollable = false;
          while (current && current !== modalEl && current !== document.body) {
            const style = window.getComputedStyle(current);
            if (
              (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
              current.scrollHeight > current.clientHeight
            ) {
              isInsideScrollable = true;
              break;
            }
            current = current.parentElement;
          }
          if (!isInsideScrollable) {
            e.preventDefault();
          }
        }
      };

      const enforceExactScroll = () => {
        if ((window as any).__isModalOpen && window.scrollY !== savedScrollYRef.current) {
          window.scrollTo(0, savedScrollYRef.current);
        }
      };

      window.addEventListener('wheel', preventBackgroundScroll, { passive: false });
      window.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
      window.addEventListener('scroll', enforceExactScroll, { passive: true });

      return () => {
        (window as any).__isModalOpen = false;
        window.removeEventListener('wheel', preventBackgroundScroll);
        window.removeEventListener('touchmove', preventBackgroundScroll);
        window.removeEventListener('scroll', enforceExactScroll);

        // Asegurar que la posición vertical queda fija en su valor original
        window.scrollTo({
          top: savedScrollYRef.current,
          behavior: 'instant' as ScrollBehavior
        });
      };
    }
  }, [activeModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  if (!activeModal) return null;

  return (
    <div
      className="modal open"
      id="modal"
      data-theme={theme}
      onClick={e => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        className={`modal-card mcard ${activeModal === 'directo' ? 'modal-wide-stream' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Anillo giratorio de gradiente cónico exterior (Idéntico a Registro / Inicio) */}
        <span className="modal-card-spin" aria-hidden="true" />

        <div className="modal-card-inner">
          {/* Barra superior con logotipo oficial libre sin contenedor y botón cerrar estilo auth */}
          <div className="modal-header-bar">
            <div className="modal-brand">
              <img src="/emblema.png" alt="Emblema Footballween" className="modal-brand-logo" />
              <div className="modal-brand-info">
                <strong>Clash Footballween</strong>
                <small>Xàtiva 2026</small>
              </div>
            </div>

            <button
              type="button"
              className="modal-close-btn mx"
              id="mx"
              onClick={closeModal}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Área de contenido sin scroll interno excesivo */}
          <div className="modal-content-area" id="mbody">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
