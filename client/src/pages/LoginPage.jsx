import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const destino = location.state?.desde || '/';

  async function enviar(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null);
    setEnviando(true);
    try {
      await login(String(f.get('email')).trim(), String(f.get('password')));
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="auth">
      <div className="auth__box">
        <h1 className="auth__title">Iniciar sesión</h1>
        <p className="auth__sub">Entra para comprar y ver el estado de tus pedidos.</p>

        <form onSubmit={enviar}>
          <div className="auth__field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="auth__field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          {error && <p className="auth__error">{error}</p>}

          <button className="btn btn--primary auth__submit" type="submit" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="auth__foot">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
        <p className="auth__foot">
          ¿Olvidaste tu contraseña? Comunícate con CubeLand para restablecerla.
        </p>
      </div>
    </section>
  );
}

export default LoginPage;