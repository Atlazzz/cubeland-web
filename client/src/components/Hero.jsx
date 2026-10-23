import cuboColor from '../assets/images/cubo-3x3-color.svg';
import './hero.css';

function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero__inner">
        <div className="hero__text">
          <p className="hero__eyebrow">Tienda especializada en cubos de velocidad</p>
          <h1 className="hero__title">Cada giro, calibrado.</h1>
          <p className="hero__lede">
            Cubos, piezas y lubricantes seleccionados para principiantes que
            están aprendiendo su primer algoritmo y speedcubers puliendo su
            tiempo personal.
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary">Ver catálogo</button>
            <button className="btn btn--ghost">Aprender a resolverlo</button>
          </div>
        </div>
        <img className="hero__cube" src={cuboColor} alt="Cubo Rubik 3x3" />
      </div>
    </section>
  );
}

export default Hero;