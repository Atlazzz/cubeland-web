import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';

function RegisterPage() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const datos = {
      name: String(f.get('name')).trim(),
      email: String(f.get('email')).trim(),
      password: String(f.get('password')),
      confirmPassword: String(f.get('confirmPassword')),
      acceptedPrivacy: f.get('acceptedPrivacy') === 'on',
    };

    if (datos.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    if (datos.password !== datos.confirmPassword) return setError('Las contraseñas no coinciden');
    if (!datos.acceptedPrivacy) return setError('Debes aceptar el aviso de privacidad');

    setError(null);
    setEnviando(true);
    try {
      await registrar(datos);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="auth">
      <div className="auth__box">
        <h1 className="auth__title">Crear cuenta</h1>
        <p className="auth__sub">Regístrate para hacer pedidos en CubeLand.</p>

        <form onSubmit={enviar}>
          <div className="auth__field">
            <label htmlFor="name">Nombre</label>
            <input id="name" name="name" type="text" required maxLength={100} autoComplete="name" />
          </div>
          <div className="auth__field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="auth__field">
            <label htmlFor="password">Contraseña (mínimo 8 caracteres)</label>
            <input id="password" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
          </div>
          <div className="auth__field">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required maxLength={72} autoComplete="new-password" />
          </div>

          <label className="auth__check">
            <input type="checkbox" name="acceptedPrivacy" />
            <span>Acepto el aviso de privacidad</span>
          </label>

          {error && <p className="auth__error">{error}</p>}

          <button className="btn btn--primary auth__submit" type="submit" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Registrarme'}
          </button>
        </form>

        <p className="auth__foot">
          ¿Ya tienes cuenta? <Link to="/iniciar-sesion">Inicia sesión</Link>
        </p>
      </div>
    </section>
  );
}

export default RegisterPage;