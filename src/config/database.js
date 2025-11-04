const sqlite3 = require("sqlite3").verbose();
const dbPath = process.env.DB_PATH || "./database.db";

// Conectar a la base de datos SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err.message);
  }
  console.log("Conectado a la base de datos SQLite.");
});

// Serializar la ejecución de comandos para asegurar el orden
db.serialize(() => {
  // Habilitar claves foráneas
  db.run("PRAGMA foreign_keys = ON;", (err) => {
    if (err) {
      console.error("Error al habilitar foreign keys:", err.message);
    }
  });

  // --- Creación de Tablas ---

  // Tabla Roles
  db.run(
    `CREATE TABLE IF NOT EXISTS Roles (
        rol_id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_rol TEXT NOT NULL UNIQUE
    )`,
    (err) => {
      if (err) console.error("Error al crear tabla Roles:", err.message);
    }
  );

  // Insertar roles básicos si no existen
  db.run(
    `INSERT OR IGNORE INTO Roles (nombre_rol) VALUES ('Agente')`,
    (err) => {
      if (err) console.error("Error al insertar rol Agente:", err.message);
    }
  );
  db.run(
    `INSERT OR IGNORE INTO Roles (nombre_rol) VALUES ('Administrador')`,
    (err) => {
      if (err)
        console.error("Error al insertar rol Administrador:", err.message);
    }
  );

  // Tabla Usuarios
  db.run(
    `CREATE TABLE IF NOT EXISTS Usuarios (
        usuario_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        nombre_completo TEXT,
        email TEXT UNIQUE,
        rol_id INTEGER NOT NULL,
        es_principal INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (rol_id) REFERENCES Roles(rol_id)
    )`,
    (err) => {
      if (err) console.error("Error al crear tabla Usuarios:", err.message);
    }
  );

  // Tabla Carpetas
  db.run(
    `CREATE TABLE IF NOT EXISTS Carpetas (
        carpeta_id INTEGER PRIMARY KEY AUTOINCREMENT,
        agente_id INTEGER NOT NULL,
        numero_expediente TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agente_id) REFERENCES Usuarios(usuario_id)
    )`,
    (err) => {
      if (err) console.error("Error al crear tabla Carpetas:", err.message);
    }
  );

  // Tabla Apartados_Plantilla
  db.run(
    `CREATE TABLE IF NOT EXISTS Apartados_Plantilla (
        apartado_plantilla_id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_apartado TEXT NOT NULL UNIQUE,
        descripcion TEXT
    )`,
    (err) => {
      if (err)
        console.error("Error al crear tabla Apartados_Plantilla:", err.message);
    }
  );

  // Tabla Documentos
  db.run(
    `CREATE TABLE IF NOT EXISTS Documentos (
        documento_id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_archivo TEXT NOT NULL,
        ruta_archivo TEXT NOT NULL,
        fecha_carga TEXT DEFAULT CURRENT_TIMESTAMP,
        usuario_carga_id INTEGER,
        FOREIGN KEY (usuario_carga_id) REFERENCES Usuarios(usuario_id)
    )`,
    (err) => {
      if (err) console.error("Error al crear tabla Documentos:", err.message);
    }
  );

  // Tabla Carpetas_Apartados (Tabla de unión)
  db.run(
    `CREATE TABLE IF NOT EXISTS Carpetas_Apartados (
        carpeta_apartado_id INTEGER PRIMARY KEY AUTOINCREMENT,
        carpeta_id INTEGER NOT NULL,
        apartado_plantilla_id INTEGER NOT NULL,
        existe INTEGER NOT NULL DEFAULT 0,
        documento_id INTEGER,
        FOREIGN KEY (carpeta_id) REFERENCES Carpetas(carpeta_id) ON DELETE CASCADE,
        FOREIGN KEY (apartado_plantilla_id) REFERENCES Apartados_Plantilla(apartado_plantilla_id),
        FOREIGN KEY (documento_id) REFERENCES Documentos(documento_id) ON DELETE SET NULL,
        UNIQUE (carpeta_id, apartado_plantilla_id)
    )`,
    (err) => {
      if (err)
        console.error("Error al crear tabla Carpetas_Apartados:", err.message);
    }
  );

  // Tabla Audiencias
  db.run(
    `CREATE TABLE IF NOT EXISTS Audiencias (
        audiencia_id INTEGER PRIMARY KEY AUTOINCREMENT,
        carpeta_id INTEGER NOT NULL,
        agente_id INTEGER NOT NULL,
        tipo_audiencia TEXT,
        fecha_fase_inicial TEXT,
        fecha_fase_intermedia TEXT,
        fecha_juicio_oral TEXT,
        FOREIGN KEY (carpeta_id) REFERENCES Carpetas(carpeta_id) ON DELETE CASCADE,
        FOREIGN KEY (agente_id) REFERENCES Usuarios(usuario_id)
    )`,
    (err) => {
      if (err) console.error("Error al crear tabla Audiencias:", err.message);
    }
  );

  // Tabla Tareas
  db.run(
    `CREATE TABLE IF NOT EXISTS Tareas (
        tarea_id INTEGER PRIMARY KEY AUTOINCREMENT,
        agente_id INTEGER NOT NULL,
        titulo_tarea TEXT NOT NULL,
        descripcion TEXT,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        fecha_vencimiento TEXT,
        completada INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (agente_id) REFERENCES Usuarios(usuario_id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) console.error("Error al crear tabla Tareas:", err.message);
    }
  );

  // Tabla Usuario_Emails_Notif
  db.run(
    `CREATE TABLE IF NOT EXISTS Usuario_Emails_Notif (
        email_notif_id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id) ON DELETE CASCADE,
        UNIQUE (usuario_id, email)
    )`,
    (err) => {
      if (err)
        console.error(
          "Error al crear tabla Usuario_Emails_Notif:",
          err.message
        );
    }
  );

  // --- Lógica para insertar usuario administrador principal si no existe ---
  db.get(
    `SELECT usuario_id FROM Usuarios WHERE es_principal = 1`,
    [],
    (err, row) => {
      if (err) {
        console.error("Error al buscar admin principal:", err.message);
        return;
      }

      if (!row) {
        // No existe un admin principal, crear uno
        db.get(
          `SELECT rol_id FROM Roles WHERE nombre_rol = 'Administrador'`,
          [],
          (err, rolRow) => {
            if (err) {
              console.error(
                "Error al buscar rol 'Administrador':",
                err.message
              );
              return;
            }

            if (rolRow) {
              const adminRolId = rolRow.rol_id;
              const adminUser = "adminprincipal";
              // ADVERTENCIA: Esta es una contraseña en TEXTO PLANO.
              // El script de registro y login debe usar bcrypt (o similar) para hashear
              // las contraseñas y compararlas con el campo 'password_hash'.
              // Esto es solo un placeholder para la inicialización.
              const adminPassPlaceholder = "adminpass1234";

              console.warn(`
        *****************************************************************
        ADVERTENCIA: Creando usuario 'adminprincipal' con contraseña
        en texto plano ('${adminPassPlaceholder}') en la columna 'password_hash'.                
        Asegúrese de que su lógica de autenticación (login/registro)
        esté usando bcryptjs para hashear y verificar contraseñas.
        Puede cambiar esta contraseña manualmente o al registrar
        un nuevo administrador principal.
        *****************************************************************
                  `);

              db.run(
                `INSERT INTO Usuarios 
                                (username, password_hash, nombre_completo, email, rol_id, es_principal) 
                            VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  adminUser,
                  adminPassPlaceholder,
                  "Administrador Principal",
                  "admin@sigeci.com",
                  adminRolId,
                  1,
                ],
                (err) => {
                  if (err) {
                    // Ignorar error si es por restricción UNIQUE (ej. ejecución anterior fallida)
                    if (!err.message.includes("UNIQUE constraint failed")) {
                      console.error(
                        "Error al insertar admin principal:",
                        err.message
                      );
                    }
                  } else {
                    console.log(
                      "Usuario administrador principal 'adminprincipal' creado exitosamente."
                    );
                  }
                }
              );
            } else {
              console.error(
                "Error: No se pudo encontrar el rol 'Administrador' para crear el usuario principal."
              );
            }
          }
        );
      }
    }
  );
});

module.exports = db;
