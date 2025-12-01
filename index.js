const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Base de datos SQLite
const db = new sqlite3.Database("database.db", (err) => {
    if (err) console.error("Error abriendo DB:", err.message);
    else console.log("Base de datos conectada");
});

// Crear tabla si no existe
db.run(`CREATE TABLE IF NOT EXISTS enlaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT,
    url TEXT
)`, (err) => {
    if (err) console.error("Error creando tabla:", err.message);
});

// Endpoint de prueba
app.get("/ping", (req, res) => {
    res.send("pong");
});

// Página principal
app.get("/", (req, res) => {
    db.all("SELECT * FROM enlaces ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Error en la base de datos");
        }

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
                <h1 class="mb-4 text-center"> Biblioteca de Enlaces </h1>
                
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
        </html>
        `;

        res.send(html);
    });
});

// Agregar enlace
app.post("/add", (req, res) => {
    const { titulo, url } = req.body;
    db.run("INSERT INTO enlaces (titulo, url) VALUES (?, ?)", [titulo, url], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Error agregando enlace");
        }
        res.redirect("/");
    });
});

// Eliminar enlace
app.get("/delete/:id", (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM enlaces WHERE id = ?", [id], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Error eliminando enlace");
        }
        res.redirect("/");
    });
});

// Mostrar formulario de edición
app.get("/edit/:id", (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM enlaces WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Error consultando enlace");
        }

        if (!row) return res.status(404).send("Enlace no encontrado");

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
    });
});

// Procesar edición
app.post("/edit/:id", (req, res) => {
    const id = req.params.id;
    const { titulo, url } = req.body;
    db.run("UPDATE enlaces SET titulo = ?, url = ? WHERE id = ?", [titulo, url, id], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Error actualizando enlace");
        }
        res.redirect("/");
    });
});

// Puerto dinámico para Railway / Render
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));

app.get("/ping", (req, res) => {
    res.send("pong");
});

