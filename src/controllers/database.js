// Database connection
const sqlite3 = require("sqlite3").verbose();

// Ruta de base de datos
const DB_path = "./database/sigeci.db";

// Coneccion a la base de datos
const db = new sqlite3.Database(DB_path, (err) => {
  if (err) {
    console.error("Error al abrir la base de datos: ", err.message);
  } else {
    console.log("Conectado a la base de datos SQlite.");
    // Creación de las tablas de la base de datos
    crearTablas();
  }
});

// Funcion de crear las tablas si no existen
function crearTablas() {
  db.serialize(() => {
    // 1. Tabla de Roles (Agente y Administrador)
    db.run(
      `
            CREATE TABLE IF NOT EXISTS Roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE
            )
            `,
      (err) => {
        if (err) console.error("Error creando la tabla roles: ", err);

        // Insertar roles si no existen
        db.run(`INSERT OR IGNORE INTO Roles (nombre) VALUES ('Agente')`);
        db.run(`INSERT OR IGNORE INTO Roles (nombre) VALUES ('Administrador')`);
      }
    );

    // 2. Crear tabla Usuarios
    db.run(
      `
            CREATE TABLE IF NOT EXISTS Usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                rol_id INTEGER,
                principal INTEGER DEFAULT 0,
                FOREIGN KEY (rol_id) REFERENCES Roles(id)
            )
            `,
      (err) => {
        if (err) console.error("Error creando la tabla Usuarios: ", err);
      }
    );

    // Aqui se añadiran mas tablas
  });
}
