import React from 'react';

export const SimarroModal: React.FC = () => {
  return (
    <div>
      <h2>
        IES Dr. <em>Lluís Simarro</em>
      </h2>
      <p style={{ marginBottom: '12px' }}>
        El instituto alberga la fase eliminatoria completa: <b>Octavos de Final, Cuartos y Semifinales</b>.
      </p>

      <div className="mgrid">
        <div>
          <strong>Sede Previa</strong>
          Aula de Informática y Departamentos de Informática
        </div>
        <div>
          <strong>Cota de Altitud</strong>
          85 metros en la base del valle
        </div>
        <div>
          <strong>Instalaciones</strong>
          Pistas de juego equipadas con monitores de baja latencia y fibra óptica
        </div>
        <div>
          <strong>Proyección en Vivo</strong>
          Pantalla gigante en el patio interior para todo el alumnado
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '12px' }}>
        Los dos ganadores de las semifinales iniciarán el ascenso a la cumbre del monte Vernissa
        junto al equipo de jueces y realizadores para la coronación en el castillo.
      </p>
    </div>
  );
};

