require('dotenv').config();
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Conexión a PostgreSQL
const db = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432
});

db.connect()
  .then(() => console.log("Conectado a PostgreSQL"))
  .catch(err => console.error("Error conectando a PostgreSQL:", err.message));

// Crear tabla si no existe
db.query(`CREATE TABLE IF NOT EXISTS enlaces (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255),
    url VARCHAR(255)
)`)
.then(() => console.log("Tabla creada o ya existente"))
.catch(err => console.error("Error creando tabla:", err.message));

// Endpoint de prueba
app.get("/ping", (req, res) => {
    res.send("pong");
});

// Página principal
app.get("/", (req, res) => {
    db.query("SELECT * FROM enlaces ORDER BY id DESC")
      .then(result => {
        const rows = result.rows;

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Biblioteca de Enlaces</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container my-5">
                <h1 class="mb-4 text-center">Biblioteca de Enlaces</h1>
                <form method="POST" action="/add" class="mb-5">
                    <div class="mb-3">
                        <input type="text" name="titulo" placeholder="Título del recurso" required class="form-control">
                    </div>
                    <div class="mb-3">
                        <input type="url" name="url" placeholder="URL del recurso" required class="form-control">
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Agregar enlace</button>
                </form>
                <ul class="list-group">`;

        rows.forEach(row => {
            html += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <a href="${row.url}" target="_blank">${row.titulo}</a>
                <div>
                    <a href="/edit/${row.id}" class="btn btn-sm btn-warning me-2">Editar</a>
                    <a href="/delete/${row.id}" class="btn btn-sm btn-danger">Borrar</a>
                </div>
            </li>`;
        });

        html += `
                </ul>
            </div>
        </body>
        </html>`;

        res.send(html);
      })
      .catch(err => {
        console.error(err.message);
        res.status(500).send("Error en la base de datos");
      });
});

// Agregar enlace
app.post("/add", (req, res) => {
    const { titulo, url } = req.body;
    db.query("INSERT INTO enlaces (titulo, url) VALUES ($1, $2)", [titulo, url])
      .then(() => res.redirect("/"))
      .catch(err => {
          console.error(err.message);
          res.status(500).send("Error agregando enlace");
      });
});

// Eliminar enlace
app.get("/delete/:id", (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM enlaces WHERE id = $1", [id])
      .then(() => res.redirect("/"))
      .catch(err => {
          console.error(err.message);
          res.status(500).send("Error eliminando enlace");
      });
});

// Mostrar formulario de edición
app.get("/edit/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM enlaces WHERE id = $1", [id])
      .then(result => {
        if (!result.rows.length) return res.status(404).send("Enlace no encontrado");
        const row = result.rows[0];

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Editar Enlace</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
        <div class="container my-5">
            <h1 class="mb-4 text-center">Editar Enlace</h1>
            <form method="POST" action="/edit/${row.id}">
                <div class="mb-3">
                    <input type="text" name="titulo" value="${row.titulo}" class="form-control" required>
                </div>
                <div class="mb-3">
                    <input type="url" name="url" value="${row.url}" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-warning w-100">Actualizar enlace</button>
            </form>
        </div>
        </body>
        </html>
        `;
        res.send(html);
      })
      .catch(err => {
          console.error(err.message);
          res.status(500).send("Error consultando enlace");
      });
});

// Procesar edición
app.post("/edit/:id", (req, res) => {
    const id = req.params.id;
    const { titulo, url } = req.body;
    db.query("UPDATE enlaces SET titulo = $1, url = $2 WHERE id = $3", [titulo, url, id])
      .then(() => res.redirect("/"))
      .catch(err => {
          console.error(err.message);
          res.status(500).send("Error actualizando enlace");
      });
});

// Puerto dinámico para Railway / Render
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
