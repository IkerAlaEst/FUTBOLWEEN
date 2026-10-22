import React from 'react';

export const RulesModal: React.FC = () => {
  return (
    <div>
      <h2>
        Reglamento Oficial · <em>Modo 95</em>
      </h2>
      <p style={{ marginBottom: '12px' }}>
        Normativa competitiva avalada por la organización para garantizar la máxima igualdad deportiva entre participantes.
      </p>

      <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li>
          <b>Duración:</b> 5 minutos por parte en todos los encuentros eliminatorios.
        </li>
        <li>
          <b>Media Equilibrada (Modo 95):</b> Todas las plantillas de EA FC se ajustan automáticamente a 95 de media general.
        </li>
        <li>
          <b>Elección de Equipos:</b> Libre elección. Se permite el enfrentamiento con el mismo club (ej: Valencia vs Valencia).
        </li>
        <li>
          <b>Mandos de Juego:</b> Se permite mando propio verificado (DualSense / Xbox) o mandos oficiales del centro educativo.
        </li>
        <li>
          <b>Empates:</b> Prórroga clásica con gol de oro o tanda reglamentaria de penaltis si persiste la igualdad.
        </li>
        <li>
          <b>Deportividad y Fair Play:</b> Cualquier conducta antideportiva conllevará la descalificación inmediata dictada por los árbitros.
        </li>
      </ul>
    </div>
  );
};

