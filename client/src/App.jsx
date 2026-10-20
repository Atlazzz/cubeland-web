import { useEffect, useState } from 'react';

function App() {
  const [dato, setDato] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/salud')
      .then((res) => res.json())
      .then((json) => setDato(json))
      .catch(() => setDato({ mensaje: 'No se pudo conectar con el servidor' }));
  }, []);

  return (
    <div>
      <h1>CubeLand</h1>
      <p>{dato ? dato.mensaje : 'Cargando...'}</p>
    </div>
  );
}

export default App;