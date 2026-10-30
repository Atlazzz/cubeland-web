import './about.css';

function About() {
  return (
    <section className="about" id="nosotros">
      <div className="about__inner">
        <div>
          <h2 className="about__title">Sobre CubeLand</h2>
          <p className="about__lede">
            CubeLand es una tienda de cubos Rubik y accesorios para speedcubing
            fundada en 2026 en Tepexpan, Estado de México. Queremos que cualquier
            persona pueda encontrar un buen cubo y aprender a resolverlo: por eso,
            además de vender, reunimos tutoriales para avanzar desde el primer
            armado hasta el mejor tiempo personal.
          </p>
        </div>

        <ul className="about__list">
          <li>
            <h3>Para todos los niveles</h3>
            <p>Desde cubos 2x2 para empezar hasta modelos magnéticos para speedcubers.</p>
          </li>
          <li>
            <h3>Aprende a tu ritmo</h3>
            <p>Tutoriales organizados por tipo de cubo y nivel de dificultad.</p>
          </li>
          <li>
            <h3>Visítanos</h3>
            <p>Estamos en Tepexpan, Acolman, Estado de México.</p>
          </li>
        </ul>
      </div>
    </section>
  );
}

export default About;