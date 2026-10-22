import React, { useEffect } from 'react';
import { useModal } from '../../context/ModalContext';
import { navigateTo } from '../../hooks/useHashRoute';
import { Trophy, ArrowRight } from 'lucide-react';

export const BracketModal: React.FC = () => {
  const { closeModal } = useModal();

  useEffect(() => {
    closeModal();
    navigateTo('clasificacion');
  }, [closeModal]);

  return (
    <div style={{ textAlign: 'center', padding: '36px 16px' }}>
      <Trophy size={48} style={{ color: 'var(--neon-orange)', marginBottom: 14 }} />
      <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800 }}>
        Abriendo la Nueva Página de Clasificación...
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
        El cuadro eliminatorio oficial con árbol panorámico y fichas técnicas está cargando.
      </p>
      <button
        type="button"
        className="btn-primary-neon"
        onClick={() => {
          closeModal();
          navigateTo('clasificacion');
        }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
      >
        <span>Ir a la Clasificación</span>
        <ArrowRight size={15} />
      </button>
    </div>
  );
};
