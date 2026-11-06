import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  ErrorTutorial,
  idValido,
  validarTutorial,
} from '../utils/tutorialData.js';

const router = Router();
//console.log('RUTAS DE TUTORIALES CARGADAS:', import.meta.url);

const NIVELES = [
  'beginner',
  'easy',
  'intermediate',
  'advanced',
  'expert',
];

function responderError(error, res) {
  if (error instanceof ErrorTutorial) {
    return res.status(error.status).json({
      mensaje: error.message,
    });
  }

  console.error(error);

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      mensaje: 'El tipo de cubo seleccionado ya no existe',
    });
  }

  return res.status(500).json({
    mensaje: 'No se pudo completar la operación de tutoriales',
  });
}

// Lee todos los componentes del tutorial en una misma transacción.
async function leerTutorial(id, soloPublicado) {
  const conn = await pool.getConnection();
  let transaccion = false;

  try {
    await conn.query(
      'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ'
    );
    await conn.beginTransaction();
    transaccion = true;

    const [filas] = await conn.query(
      `SELECT t.id, t.title, t.description, t.cover_image,
              t.cube_type_id, t.difficulty, t.is_active,
              t.updated_at, ct.name AS cube_type
       FROM tutorials t
       JOIN cube_types ct ON ct.id = t.cube_type_id
       WHERE t.id = ?
       ${soloPublicado ? 'AND t.is_active = TRUE' : ''}`,
      [id]
    );

    if (!filas.length) {
      throw new ErrorTutorial(404, 'Tutorial no encontrado');
    }

    const [blocks] = await conn.query(
      `SELECT id, sort_order, block_type,
              text_content, image_url, image_alt
       FROM tutorial_blocks
       WHERE tutorial_id = ?
       ORDER BY sort_order`,
      [id]
    );

    const [steps] = await conn.query(
      `SELECT id, step_number, title, instruction, image_url
       FROM tutorial_steps
       WHERE tutorial_id = ?
       ORDER BY step_number`,
      [id]
    );

    const [cases] = await conn.query(
      `SELECT c.*
       FROM tutorial_cases c
       JOIN tutorial_steps s ON s.id = c.step_id
       WHERE s.tutorial_id = ?
       ORDER BY s.step_number, c.case_number`,
      [id]
    );

    const porPaso = new Map();

    for (const caso of cases) {
      if (!porPaso.has(caso.step_id)) {
        porPaso.set(caso.step_id, []);
      }

      porPaso.get(caso.step_id).push(caso);
    }

    await conn.commit();
    transaccion = false;

    return {
      ...filas[0],
      is_active: Boolean(filas[0].is_active),
      blocks,
      steps: steps.map((paso) => ({
        ...paso,
        cases: porPaso.get(paso.id) || [],
      })),
    };
  } catch (error) {
    if (transaccion) await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

// Guarda la presentación, los bloques, los pasos y los casos.
async function guardarTutorial(id, datos) {
  const conn = await pool.getConnection();
  let transaccion = false;

  try {
    await conn.beginTransaction();
    transaccion = true;

    if (id !== null) {
      const [existente] = await conn.query(
        'SELECT id FROM tutorials WHERE id = ? FOR UPDATE',
        [id]
      );

      if (!existente.length) {
        throw new ErrorTutorial(404, 'Tutorial no encontrado');
      }
    }

    const [tipos] = await conn.query(
      'SELECT id FROM cube_types WHERE id = ?',
      [datos.cube_type_id]
    );

    if (!tipos.length) {
      throw new ErrorTutorial(
        400,
        'El tipo de cubo seleccionado no existe'
      );
    }

    const valores = [
      datos.title,
      datos.description || null,
      datos.cover_image,
      datos.cube_type_id,
      datos.difficulty,
      datos.is_active,
    ];

    let tutorialId = id;

    if (id === null) {
      const [resultado] = await conn.query(
        `INSERT INTO tutorials
          (title, description, cover_image,
           cube_type_id, difficulty, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        valores
      );

      tutorialId = resultado.insertId;
    } else {
      await conn.query(
        `UPDATE tutorials
         SET title = ?, description = ?, cover_image = ?,
             cube_type_id = ?, difficulty = ?, is_active = ?
         WHERE id = ?`,
        [...valores, id]
      );

      // Los casos se eliminan por ON DELETE CASCADE.
      // Todo se restaura si falla cualquier INSERT posterior.
      await conn.query(
        'DELETE FROM tutorial_steps WHERE tutorial_id = ?',
        [id]
      );

      await conn.query(
        'DELETE FROM tutorial_blocks WHERE tutorial_id = ?',
        [id]
      );
    }

    for (const [indice, bloque] of datos.blocks.entries()) {
      await conn.query(
        `INSERT INTO tutorial_blocks
          (tutorial_id, sort_order, block_type,
           text_content, image_url, image_alt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          tutorialId,
          indice + 1,
          bloque.block_type,
          bloque.text_content,
          bloque.image_url,
          bloque.image_alt,
        ]
      );
    }

    for (const [indice, paso] of datos.steps.entries()) {
      const [resultado] = await conn.query(
        `INSERT INTO tutorial_steps
          (tutorial_id, step_number, title, instruction, image_url)
         VALUES (?, ?, ?, ?, ?)`,
        [
          tutorialId,
          indice + 1,
          paso.title,
          paso.instruction,
          paso.image_url,
        ]
      );

      for (const [numero, caso] of paso.cases.entries()) {
        await conn.query(
          `INSERT INTO tutorial_cases
            (step_id, case_number, case_image_url, case_image_alt,
             description, algorithm,
             moves_image_url, moves_image_alt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            resultado.insertId,
            numero + 1,
            caso.case_image_url,
            caso.case_image_alt,
            caso.description,
            caso.algorithm,
            caso.moves_image_url,
            caso.moves_image_alt,
          ]
        );
      }
    }

    await conn.commit();
    transaccion = false;

    return tutorialId;
  } catch (error) {
    if (transaccion) await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

// GET /api/tutoriales?q=&tipo=&nivel=
router.get('/', async (req, res) => {
  const { q = '', tipo = '', nivel = '' } = req.query;

  if (
    typeof q !== 'string' ||
    typeof tipo !== 'string' ||
    typeof nivel !== 'string' ||
    q.length > 150 ||
    (tipo !== '' && !idValido(tipo)) ||
    (nivel !== '' && !NIVELES.includes(nivel))
  ) {
    return res.status(400).json({
      mensaje: 'Los filtros no son válidos',
    });
  }

  try {
    const condiciones = ['t.is_active = TRUE'];
    const valores = [];

    if (q.trim()) {
      const patron = `%${q.trim()}%`;

      condiciones.push(`(
        t.title LIKE ?
        OR t.description LIKE ?
        OR EXISTS (
          SELECT 1 FROM tutorial_blocks b
          WHERE b.tutorial_id = t.id
            AND b.text_content LIKE ?
        )
        OR EXISTS (
          SELECT 1 FROM tutorial_steps s
          WHERE s.tutorial_id = t.id
            AND (s.title LIKE ? OR s.instruction LIKE ?)
        )
        OR EXISTS (
          SELECT 1
          FROM tutorial_cases c
          JOIN tutorial_steps s ON s.id = c.step_id
          WHERE s.tutorial_id = t.id
            AND (c.description LIKE ? OR c.algorithm LIKE ?)
        )
      )`);

      valores.push(
        patron, patron, patron, patron,
        patron, patron, patron
      );
    }

    if (tipo) {
      condiciones.push('t.cube_type_id = ?');
      valores.push(Number(tipo));
    }

    if (nivel) {
      condiciones.push('t.difficulty = ?');
      valores.push(nivel);
    }

    const [tutoriales] = await pool.query(
      `SELECT t.id, t.title, t.description, t.cover_image,
              t.cube_type_id, t.difficulty,
              ct.name AS cube_type,
              (
                SELECT COUNT(*)
                FROM tutorial_steps s
                WHERE s.tutorial_id = t.id
              ) AS steps_count
       FROM tutorials t
       JOIN cube_types ct ON ct.id = t.cube_type_id
       WHERE ${condiciones.join(' AND ')}
       ORDER BY ct.name, t.title, t.id`,
      valores
    );

    const [tipos] = await pool.query(
      `SELECT DISTINCT ct.id, ct.name
       FROM cube_types ct
       JOIN tutorials t ON t.cube_type_id = ct.id
       WHERE t.is_active = TRUE
       ORDER BY ct.name`
    );

    res.json({ tutoriales, tipos });
  } catch (error) {
    responderError(error, res);
  }
});

// Todo lo que esté bajo /admin requiere personal autorizado.
router.use('/admin', requireAuth, requireRole('staff'));

// GET /api/tutoriales/admin
router.get('/admin', async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT t.id, t.title, t.description, t.cover_image,
              t.cube_type_id, t.difficulty, t.is_active,
              ct.name AS cube_type
       FROM tutorials t
       JOIN cube_types ct ON ct.id = t.cube_type_id
       ORDER BY t.id DESC`
    );

    const [tipos] = await pool.query(
      'SELECT id, name FROM cube_types ORDER BY name'
    );

    res.json({
      tutoriales: filas.map((t) => ({
        ...t,
        is_active: Boolean(t.is_active),
      })),
      tipos,
    });
  } catch (error) {
    responderError(error, res);
  }
});

// GET /api/tutoriales/admin/:id
router.get('/admin/:id', async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      throw new ErrorTutorial(404, 'Tutorial no encontrado');
    }

    const tutorial = await leerTutorial(
      Number(req.params.id),
      false
    );

    res.json(tutorial);
  } catch (error) {
    responderError(error, res);
  }
});

// POST /api/tutoriales/admin
router.post('/admin', async (req, res) => {
  try {
    const datos = validarTutorial(req.body);
    const id = await guardarTutorial(null, datos);

    res.status(201).json({
      id,
      mensaje: 'Tutorial creado',
    });
  } catch (error) {
    responderError(error, res);
  }
});

// PUT /api/tutoriales/admin/:id
router.put('/admin/:id', async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      throw new ErrorTutorial(400, 'Tutorial no válido');
    }

    const datos = validarTutorial(req.body);

    const id = await guardarTutorial(
      Number(req.params.id),
      datos
    );

    res.json({
      id,
      mensaje: 'Tutorial actualizado',
    });
  } catch (error) {
    responderError(error, res);
  }
});

// DELETE /api/tutoriales/admin/:id
router.delete('/admin/:id', async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      throw new ErrorTutorial(400, 'Tutorial no válido');
    }

    const [resultado] = await pool.query(
      'DELETE FROM tutorials WHERE id = ?',
      [Number(req.params.id)]
    );

    if (!resultado.affectedRows) {
      throw new ErrorTutorial(404, 'Tutorial no encontrado');
    }

    res.json({ mensaje: 'Tutorial eliminado' });
  } catch (error) {
    responderError(error, res);
  }
});

// GET /api/tutoriales/:id
// Debe permanecer después de las rutas /admin.
router.get('/:id', async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      throw new ErrorTutorial(404, 'Tutorial no encontrado');
    }

    const tutorial = await leerTutorial(
      Number(req.params.id),
      true
    );

    res.json(tutorial);
  } catch (error) {
    responderError(error, res);
  }
});

export default router;