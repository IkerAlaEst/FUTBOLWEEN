import React from 'react';

export const CastleModal: React.FC = () => {
  return (
    <div>
      <h2>
        Castell de <em>Xàtiva</em>
      </h2>
      <p style={{ marginBottom: '12px' }}>
        El emblemático castillo bicéfalo de Xàtiva corona el monte Vernissa a más de 300 metros sobre el valle.
        Aquí se disputará la <b>Gran Final de CLASH FOOTBALLWEEN</b> en la noche del <b>31 de octubre a las 20:00 h</b>.
      </p>

      <div className="mgrid">
        <div>
          <strong>Ubicación</strong>
          Torre Mayor del Castell Menor / Castell Major
        </div>
        <div>
          <strong>Cota de Altitud</strong>
          310 metros sobre el nivel del mar
        </div>
        <div>
          <strong>Acceso</strong>
          Exclusivo para los 2 finalistas clasificados y jueces oficiales
        </div>
        <div>
          <strong>Premio Legendario</strong>
          El estandarte del campeón ondeará en la fortaleza durante un año
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>
        Plan de contingencia: En caso de condiciones meteorológicas adversas o fuerte temporal de viento, la final
        se trasladará con enlace directo al aula de audiovisuales del IES Simarro.
      </p>
    </div>
  );
};

