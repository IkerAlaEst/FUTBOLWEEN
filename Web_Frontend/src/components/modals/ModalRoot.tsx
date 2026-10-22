import React from 'react';
import { useModal } from '../../context/ModalContext';
import { ModalContainer } from './ModalContainer';
import { ProfileModal } from './ProfileModal';
import { BracketModal } from './BracketModal';
import { RefereeModal } from './RefereeModal';
import { PlayersModal } from './PlayersModal';
import { LiveModal } from './LiveModal';
import { CastleModal } from './CastleModal';
import { RulesModal } from './RulesModal';
import { SimarroModal } from './SimarroModal';
import { GamerModal } from './GamerModal';
import { WizardModal } from './WizardModal';
import { WarriorModal } from './WarriorModal';
import { GuardiansModal } from './GuardiansModal';
import { QuickAccessModal } from './QuickAccessModal';
import { LocationModal } from './LocationModal';
import { GameModal } from './GameModal';

export const ModalRoot: React.FC = () => {
  const { activeModal } = useModal();

  if (!activeModal) return null;

  // El easter egg del juego cuenta con su propio marco cinematográfico e interfaz
  if (activeModal === 'game') {
    return <GameModal />;
  }

  const renderContent = () => {
    switch (activeModal) {
      case 'acceso_rapido':
        return <QuickAccessModal />;
      case 'ubicaciones':
      case 'ubicacion_torneo':
      case 'ubicacion_final':
        return <LocationModal />;
      case 'normas':
        return <GamerModal />;
      case 'setup_mandos':
        return <WizardModal />;
      case 'cuadro_guerrero':
        return <WarriorModal />;
      case 'gran_final':
        return <GuardiansModal />;
      case 'perfil':
        return <ProfileModal />;
      case 'bracket':
        return <BracketModal />;
      case 'acta':
        return <RefereeModal />;
      case 'jugadores':
        return <PlayersModal />;
      case 'directo':
        return <LiveModal />;
      case 'castillo':
        return <GuardiansModal />;
      case 'partido':
        return <GamerModal />;
      case 'torneo':
        return <WarriorModal />;
      case 'insti':
        return <SimarroModal />;
      default:
        return null;
    }
  };

  return <ModalContainer>{renderContent()}</ModalContainer>;
};
