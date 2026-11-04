import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ComingSoonPage from './pages/ComingSoonPage';
import ProductDetailPage from './pages/ProductDetailPage';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route
    path="/tutoriales"
    element={
      <ComingSoonPage
        titulo="Tutoriales"
        descripcion="Estamos preparando guías paso a paso con imágenes, por tipo de cubo y nivel de dificultad."
      />
    }
  />
  <Route
    path="/contacto"
    element={
      <ComingSoonPage
        titulo="Contacto"
        descripcion="Pronto podrás ver nuestros datos de contacto, la ubicación en el mapa y enviarnos un mensaje."
      />
    }
  />
  <Route path="/producto/:id" element={<ProductDetailPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;