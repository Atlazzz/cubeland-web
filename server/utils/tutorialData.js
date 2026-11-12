const NIVELES = [
  'beginner',
  'easy',
  'intermediate',
  'advanced',
  'expert',
];

export class ErrorTutorial extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

function rechazar(mensaje) {
  throw new ErrorTutorial(400, mensaje);
}

export function idValido(valor) {
  return (
    ['string', 'number'].includes(typeof valor) &&
    /^[1-9]\d*$/.test(String(valor)) &&
    Number.isSafeInteger(Number(valor))
  );
}

function objeto(valor, campo) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    rechazar(`${campo} no es válido`);
  }
}

function texto(valor, campo, maximo, obligatorio = false) {
  if (valor === undefined || valor === null) valor = '';

  if (typeof valor !== 'string') {
    rechazar(`${campo} debe ser texto`);
  }

  const limpio = valor.trim();

  if (obligatorio && !limpio) {
    rechazar(`Completa ${campo}`);
  }

  if (limpio.length > maximo) {
    rechazar(`${campo} admite hasta ${maximo} caracteres`);
  }

  return limpio;
}

function imagen(valor, campo, maximo = 500) {
  const ruta = texto(valor, campo, maximo);

  if (!ruta) return null;

  // Permite archivos dentro de client/public/tutoriales/.
  if (
    /^\/tutoriales\/[a-zA-Z0-9_/-]+\.(png|jpe?g|webp|gif|svg)$/i.test(ruta)
  ) {
    return ruta;
  }

  try {
    const url = new URL(ruta);

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      rechazar(`${campo} debe ser una URL HTTP o HTTPS sin credenciales`);
    }
  } catch (error) {
    if (error instanceof ErrorTutorial) throw error;

    rechazar(
      `${campo} debe ser una URL o una ruta como /tutoriales/imagen.png`
    );
  }

  return ruta;
}

function lista(valor, campo, maximo) {
  if (!Array.isArray(valor) || valor.length > maximo) {
    rechazar(`${campo} debe ser una lista de hasta ${maximo} elementos`);
  }

  return valor;
}

export function validarTutorial(body) {
  objeto(body, 'El tutorial');

  if (!idValido(body.cube_type_id)) {
    rechazar('Selecciona un tipo de cubo válido');
  }

  if (!NIVELES.includes(body.difficulty)) {
    rechazar('Selecciona una dificultad válida');
  }

  if (typeof body.is_active !== 'boolean') {
    rechazar('El estado de publicación no es válido');
  }

  const datos = {
    title: texto(body.title, 'el título general', 150, true),
    description: texto(body.description, 'el resumen', 255),
    cover_image: imagen(body.cover_image, 'La portada', 255),
    cube_type_id: Number(body.cube_type_id),
    difficulty: body.difficulty,
    is_active: body.is_active,
  };

  datos.blocks = lista(body.blocks, 'Los bloques', 100).map((b, i) => {
    objeto(b, `El bloque ${i + 1}`);

    if (!['text', 'image'].includes(b.block_type)) {
      rechazar(`Selecciona el tipo del bloque ${i + 1}`);
    }

    if (b.block_type === 'text') {
      return {
        block_type: 'text',
        text_content: texto(
          b.text_content,
          `el texto del bloque ${i + 1}`,
          15000,
          true
        ),
        image_url: null,
        image_alt: null,
      };
    }

    const url = imagen(b.image_url, `La imagen del bloque ${i + 1}`);

    if (!url) {
      rechazar(`Agrega la imagen del bloque ${i + 1}`);
    }

    return {
      block_type: 'image',
      text_content: null,
      image_url: url,
      image_alt: texto(
        b.image_alt,
        `la descripción de imagen del bloque ${i + 1}`,
        255,
        true
      ),
    };
  });

  datos.steps = lista(body.steps, 'Los pasos', 255).map((s, i) => {
    objeto(s, `El paso ${i + 1}`);

    return {
      title: texto(s.title, `el título del paso ${i + 1}`, 120, true),
      instruction: texto(
        s.instruction,
        `la introducción del paso ${i + 1}`,
        15000
      ),
      image_url: imagen(
        s.image_url,
        `La imagen general del paso ${i + 1}`,
        255
      ),
      cases: lista(
        s.cases,
        `Los casos del paso ${i + 1}`,
        100
      ).map((c, j) => {
        objeto(c, `El caso ${j + 1} del paso ${i + 1}`);

        const referencia = `del caso ${j + 1}, paso ${i + 1}`;

        const caseImage = imagen(
          c.case_image_url,
          `La imagen ${referencia}`
        );

        const movesImage = imagen(
          c.moves_image_url,
          `La imagen de movimientos ${referencia}`
        );

        return {
          case_image_url: caseImage,
          case_image_alt: texto(
            c.case_image_alt,
            `la descripción de imagen ${referencia}`,
            255,
            Boolean(caseImage)
          ) || null,
          description: texto(
            c.description,
            `la descripción ${referencia}`,
            15000,
            true
          ),
          algorithm: texto(
            c.algorithm,
            `el algoritmo ${referencia}`,
            500
          ) || null,
          moves_image_url: movesImage,
          moves_image_alt: texto(
            c.moves_image_alt,
            `la descripción de movimientos ${referencia}`,
            255,
            Boolean(movesImage)
          ) || null,
        };
      }),
    };
  });

  if (datos.is_active && datos.steps.length === 0) {
    rechazar('Agrega al menos un paso antes de publicar el tutorial');
  }

  return datos;
}