const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "cok_gizli_super_anahtar";

exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Bu email zaten kayıtlı." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, role',
      [username, email, hashedPassword, role]
    );

    res.status(201).json({ success: true, message: "Kayıt başarılı!", user: newUser.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Kullanıcı bulunamadı." });
    }
    const user = userRes.rows[0];

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      return res.status(400).json({ success: false, message: "Hatalı şifre!" });
    }

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      success: true,
      token,
      user: { user_id: user.user_id, username: user.username, role: user.role }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
};