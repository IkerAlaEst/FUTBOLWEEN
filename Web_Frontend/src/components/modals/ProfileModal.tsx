import React, { useRef, useState } from 'react';
import { AlertCircle, Camera, Crown, Scale, Gamepad2, Sparkles, LogOut, Trash2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { navigateTo } from '../../hooks/useHashRoute';

export const ProfileModal: React.FC = () => {
  const { user, logout, deleteAccount, isAdmin, isReferee, updateAvatar } = useAuth();
  const { closeModal } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    setUploading(true);
    try {
      await updateAvatar(file);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'No se pudo subir la foto.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      closeModal();
      navigateTo('home');
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Error al eliminar la cuenta.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!user) {
    return (
      <div>
        <h2>No hay <em>sesión activa</em></h2>
        <p>Inicia sesión o regístrate para acceder a tu perfil.</p>
        <button
          type="button"
          className="btn-primary-neon"
          onClick={() => {
            closeModal();
            navigateTo('login');
          }}
          style={{ marginTop: '16px' }}
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  const renderRoleBadge = () => {
    if (isAdmin) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Crown size={14} /> Administrador del Sistema
        </span>
      );
    }
    if (isReferee) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Scale size={14} /> Juez / Árbitro Oficial
        </span>
      );
    }
    if (user.rol === 'usuario') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={14} /> Aficionado
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Gamepad2 size={14} /> Jugador Participante
      </span>
    );
  };

  const initialLetter = (user.nombre_completo || user.gamertag || 'U').trim().charAt(0).toUpperCase();

  return (
    <div>
      <h2>
        Perfil de <em>{user.gamertag || user.nombre_completo}</em>
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '14px 0 20px', padding: '12px', background: 'rgba(255,94,0,0.08)', borderRadius: '10px', border: '1px solid rgba(255,94,0,0.2)' }}>
        <div style={{ position: 'relative', flex: 'none' }}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={`Foto de perfil de ${user.nombre_completo}`}
              style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff5e00' }}
            />
          ) : (
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: user.rol === 'arbitro' ? '#8b5cf6' : user.rol === 'usuario' ? '#ec4899' : '#ff5e00',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                fontSize: '22px',
                fontWeight: 800,
                boxShadow: '0 0 12px rgba(255,94,0,0.3)'
              }}
            >
              {initialLetter}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Cambiar foto de perfil"
            aria-label="Cambiar foto de perfil"
            style={{
              position: 'absolute',
              right: '-4px',
              bottom: '-4px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.4)',
              background: '#1c1028',
              color: '#fbbf24',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
          >
            <Camera size={13} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{user.nombre_completo}</div>
          <div style={{ fontSize: '13px', color: '#f59e0b' }}>{renderRoleBadge()}</div>
          {uploading && <div style={{ fontSize: '12px', color: '#94a3b8' }}>Subiendo foto…</div>}
          {avatarError && (
            <div style={{ fontSize: '12px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} /> {avatarError}
            </div>
          )}
        </div>
      </div>

      <div className="mgrid">
        <div>
          <strong>Correo Electrónico</strong>
          {user.email}
        </div>
        <div>
          <strong>Gamertag EA FC</strong>
          {user.gamertag || 'No especificado'}
        </div>

        {/* Solo el JUGADOR tiene equipo y mando asignado */}
        {user.rol === 'jugador' && (
          <>
            <div>
              <strong>Club Seleccionado</strong>
              {user.club_elegido || 'Sin asignar'}
            </div>
            <div>
              <strong>Tipo de Mando</strong>
              {user.tipo_mando ? user.tipo_mando.toUpperCase() : 'Mando propio'}
            </div>
          </>
        )}

        {/* Árbitro: zona/pista y plaza */}
        {user.rol === 'arbitro' && (
          <>
            <div>
              <strong>Zona Oficial</strong>
              {user.zona || 'Aula de informática'}
            </div>
            {user.referee_slot ? (
              <div>
                <strong>Plaza de Árbitro</strong>
                Nº {user.referee_slot}
              </div>
            ) : null}
          </>
        )}

        {/* Aficionado: lema */}
        {user.rol === 'usuario' && user.bio && (
          <div style={{ gridColumn: '1 / -1' }}>
            <strong>Lema de Grada</strong>
            {user.bio}
          </div>
        )}

        {user.player_number ? (
          <div>
            <strong>Dorsal de inscripción</strong>
            Nº {user.player_number}
          </div>
        ) : null}
        {user.seed ? (
          <div>
            <strong>Posición en el cuadro</strong>
            Seed #{user.seed}
          </div>
        ) : null}
      </div>

      {isAdmin && (
        <div style={{ margin: '16px 0', padding: '10px 14px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '8px', fontSize: '13px', color: '#fde047' }}>
          <strong>Panel de Control Admin:</strong> Tienes permisos de moderador total sobre el cuadro y el chat en directo.
        </div>
      )}

      {isReferee && (
        <div style={{ margin: '16px 0', padding: '10px 14px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', fontSize: '13px', color: '#86efac' }}>
          <strong>Panel de Juez:</strong> Puedes abrir y firmar las actas de partidos en el cuadro eliminatorio.
        </div>
      )}

      {/* Zona de peligro: confirmación de eliminación de cuenta */}
      {confirmDelete && (
        <div
          style={{
            margin: '18px 0',
            padding: '14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid #ef4444',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '13.5px'
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#ef4444', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={16} /> ¿Eliminar cuenta definitivamente?
          </div>
          <p style={{ margin: '0 0 12px', lineHeight: 1.45, color: '#f8fafc' }}>
            Se eliminará por completo todo rastro de tu usuario: perfil, plaza de torneo/árbitro, mensajes y estadísticas. Esta acción no se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {deleting ? 'Eliminando…' : 'Sí, eliminar todo'}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmDelete(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#f8fafc',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-primary-neon"
          onClick={() => {
            closeModal();
            navigateTo('clasificacion');
          }}
        >
          Ver Cuadro Eliminatorio
        </button>
        <button
          type="button"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '10px 18px',
            cursor: 'pointer',
            borderRadius: '6px',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => {
            logout();
            closeModal();
          }}
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
        {!confirmDelete && (
          <button
            type="button"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              padding: '10px 16px',
              cursor: 'pointer',
              borderRadius: '6px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: 'auto'
            }}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={15} /> Eliminar Cuenta
          </button>
        )}
      </div>
    </div>
  );
};
