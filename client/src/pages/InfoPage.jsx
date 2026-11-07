import { Link } from 'react-router-dom';
import './info.css';

const PAGINAS = {
  privacidad: {
    titulo: 'Aviso de privacidad',
    introduccion:
      'Este aviso describe el uso de los datos dentro del proyecto escolar CubeLand.',
    secciones: [
      {
        titulo: 'Datos que solicita el sistema',
        texto:
          'El sistema solicita los datos necesarios para registrar una cuenta, gestionar pedidos y atender mensajes. Según la función utilizada, pueden incluir nombre, correo electrónico, teléfono y dirección de entrega.',
      },
      {
        titulo: 'Uso de la información',
        texto:
          'Los datos se utilizan para identificar tu cuenta, registrar tus compras, organizar la entrega o recolección de pedidos y atender las consultas que envíes mediante el formulario de contacto.',
      },
      {
        titulo: 'Contraseñas y acceso',
        texto:
          'Las contraseñas se almacenan mediante un hash. El acceso a las funciones de administración se restringe al personal autorizado. No compartas tu contraseña ni la incluyas en mensajes de contacto.',
      },
      {
        titulo: 'Cookies de sesión',
        texto:
          'CubeLand utiliza una cookie para mantener la sesión iniciada y permitir el acceso a funciones como el carrito y los pedidos. Si eliminas esa cookie, tendrás que iniciar sesión nuevamente.',
      },
      {
        titulo: 'Mapa de ubicación',
        texto:
          'La página de Contacto incluye un mapa de Google Maps. Al cargarlo, el navegador se comunica con ese servicio externo, que aplica sus propias condiciones y políticas de privacidad.',
      },
      {
        titulo: 'Consultas sobre tus datos',
        texto:
          'Puedes contactar a CubeLand mediante ganileeyt@gmail.com para solicitar información sobre los datos asociados a tu cuenta o plantear una solicitud de corrección o eliminación. La atención se realizará de forma manual.',
      },
    ],
  },

  terminos: {
    titulo: 'Términos y condiciones',
    introduccion:
      'Estas condiciones describen el funcionamiento de la versión de demostración de CubeLand.',
    secciones: [
      {
        titulo: 'Alcance del proyecto',
        texto:
          'CubeLand es un proyecto escolar que demuestra las funciones de una tienda de cubos Rubik y accesorios. Durante las pruebas, utiliza datos ficticios y no realices transferencias bancarias reales.',
      },
      {
        titulo: 'Cuenta de usuario',
        texto:
          'Para utilizar el carrito y registrar pedidos necesitas iniciar sesión. Eres responsable de mantener tus credenciales privadas y de revisar la información que capturas.',
      },
      {
        titulo: 'Productos y precios',
        texto:
          'Los precios se muestran en pesos mexicanos. El servidor consulta los precios y las existencias al confirmar el pedido. Si un producto ya no está disponible o no tiene suficientes piezas, el pedido no se registra.',
      },
      {
        titulo: 'Entrega y recolección',
        texto:
          'Puedes elegir envío a domicilio o recolección en tienda. El costo de envío se calcula en el servidor según las tarifas configuradas y la dirección seleccionada. La recolección no tiene costo de envío.',
      },
      {
        titulo: 'Métodos de pago',
        texto:
          'El sistema contempla transferencia bancaria y pago en tienda. El pago en tienda solo está disponible para pedidos con recolección. Esta versión no procesa pagos bancarios automáticamente.',
      },
      {
        titulo: 'Estado del pedido',
        texto:
          'Los pedidos se registran como pendientes de pago. El personal actualiza su estado desde administración. En transferencias, verifica el pago antes de preparar; en pago en tienda, confirma el cobro al entregar.',
      },
      {
        titulo: 'Tutoriales',
        texto:
          'Los tutoriales se organizan por tipo de cubo y dificultad. Revisa las indicaciones de cada paso y evita forzar el mecanismo de tu cubo.',
      },
    ],
  },

  devoluciones: {
    titulo: 'Política de devoluciones',
    introduccion:
      'Esta página presenta el procedimiento propuesto para la práctica escolar. Los plazos y condiciones comerciales definitivos están pendientes de aprobación.',
    secciones: [
      {
        titulo: 'Cómo solicitar atención',
        texto:
          'Para reportar un producto incorrecto, incompleto o con un posible defecto, escribe a ganileeyt@gmail.com o utiliza el formulario de contacto. Incluye el número de pedido, el producto y una descripción del problema.',
      },
      {
        titulo: 'Revisión de la solicitud',
        texto:
          'El personal revisará el pedido y podrá solicitar información adicional para comprender lo ocurrido. Antes de enviar un producto de regreso, contacta a CubeLand para recibir las indicaciones correspondientes.',
      },
      {
        titulo: 'Plazos y condiciones pendientes',
        texto:
          'Para la versión comercial deberán definirse el plazo para presentar solicitudes, las condiciones de recepción, los costos de transporte y el procedimiento aplicable a cambios y reembolsos. Esta demostración no establece todavía esos valores.',
      },
      {
        titulo: 'Cancelación y devolución',
        texto:
          'Cancelar un pedido desde administración cambia su estado y devuelve las existencias registradas. Esa operación no representa por sí misma una devolución física de productos ni un reembolso.',
      },
      {
        titulo: 'Reembolsos',
        texto:
          'El sistema no realiza reembolsos automáticos. Cualquier devolución de dinero requiere una gestión separada y su confirmación por parte del personal.',
      },
    ],
  },
};

function InfoPage({ tipo }) {
  const pagina = PAGINAS[tipo];

  if (!pagina) {
    return (
      <section className="info">
        <div className="info__inner">
          <h1>Página no encontrada</h1>
          <Link to="/">Volver al inicio</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="info">
      <div className="info__inner">
        <Link to="/" className="info__back">
          ← Volver al inicio
        </Link>

        <header className="info__header">
          <h1>{pagina.titulo}</h1>
          <p>{pagina.introduccion}</p>
          <span className="info__version">
            Borrador para el proyecto escolar
          </span>
        </header>

        {pagina.secciones.map((seccion) => (
          <section className="info__section" key={seccion.titulo}>
            <h2>{seccion.titulo}</h2>
            <p>{seccion.texto}</p>
          </section>
        ))}

        <div className="info__contact">
          <h2>¿Tienes alguna pregunta?</h2>
          <p>
            Escríbenos y el personal de CubeLand revisará tu consulta.
          </p>
          <Link to="/contacto" className="btn btn--primary">
            Contactar a CubeLand
          </Link>
        </div>
      </div>
    </section>
  );
}

export default InfoPage;