const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const db = require("./config/database");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// RUTA DE INICIO DE SESIÓN
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Se requiere nombre de usuario y contraseña." });
  }

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Error interno del servidor." });
      }

      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas." });
      }

      try {
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(401).json({ message: "Credenciales inválidas." });
        }

        res.json({
          message: "Inicio de sesión exitoso. Bienvenido.",
          user: { id: user.id, username: user.username },
        });
      } catch (e) {
        console.error(e);
        return res
          .status(500)
          .json({ message: "Error al verificar la contraseña." });
      }
    }
  );
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API de Autenticación Básica en funcionamiento.");
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`API Server corriendo en puerto ${PORT}`);
});
