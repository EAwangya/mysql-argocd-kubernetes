const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const { DateTime } = require('luxon');
const os = require('os');
const hostname = os.hostname();

require('dotenv').config();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL');
});

// GET / — Show users list
app.get('/', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).send('❌ DB query error');

    db.query('SELECT NOW() as now', (err2, timeResult) => {
      if (err2) return res.status(500).send('❌ Time query error');

      const nowUTC = DateTime.fromJSDate(timeResult[0].now, { zone: 'utc' });
      const denverTime = nowUTC.setZone('America/Denver').toFormat('yyyy-LL-dd HH:mm:ss ZZZZ');
      const hostname = os.hostname();

      let html = `<h3>Users from database: <code>${process.env.DB_NAME || 'myappdb'}</code></h3>`;
      html += `<p>🖥️ This application is running in a Kubernetes pod: <code>${hostname}</code></p>`;
      html += `<p>✅ Fetched ${results.length} user(s) from the database at ${denverTime} (Denver time)</p>`;

      html += `<ul>`;
      results.forEach(user => {
        html += `<li>
          ${user.name} (${user.email})
          <a href="/edit/${user.id}">Edit</a> |
          <form action="/delete/${user.id}" method="POST" style="display:inline;">
            <button type="submit">Delete</button>
          </form>
        </li>`;
      });
      html += `</ul><a href="/add">Add New User</a> | <a href="/databases">View Databases</a>`;
      res.send(html);
    });
  });
});


// GET /add — Show add user form
app.get('/add', (req, res) => {
  const form = `
    <h1>Add User</h1>
    <form action="/add" method="POST">
      <label>Name:</label><br>
      <input type="text" name="name" required><br>
      <label>Email:</label><br>
      <input type="email" name="email" required><br><br>
      <button type="submit">➕ Add</button>
    </form>
    <br><a href="/">⬅️ Back</a>
  `;
  res.send(form);
});

// POST /add — Handle user creation
app.post('/add', (req, res) => {
  const { name, email } = req.body;
  db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], err => {
    if (err) return res.status(500).send('❌ Error inserting user');
    res.redirect('/');
  });
});

// GET /edit/:id — Show edit form
app.get('/edit/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).send('❌ User not found');
    const user = results[0];
    const form = `
      <h1>Edit User</h1>
      <form action="/edit/${user.id}" method="POST">
        <label>Name:</label><br>
        <input type="text" name="name" value="${user.name}" required><br>
        <label>Email:</label><br>
        <input type="email" name="email" value="${user.email}" required><br><br>
        <button type="submit">💾 Save</button>
      </form>
      <br><a href="/">⬅️ Back</a>
    `;
    res.send(form);
  });
});

// POST /edit/:id — Handle user update
app.post('/edit/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id], err => {
    if (err) return res.status(500).send('❌ Error updating user');
    res.redirect('/');
  });
});

// POST /delete/:id — Handle user deletion
app.post('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE id = ?', [id], err => {
    if (err) return res.status(500).send('❌ Error deleting user');
    res.redirect('/');
  });
});

// GET /databases — List all databases
app.get('/databases', (req, res) => {
  db.query('SHOW DATABASES', (err, results) => {
    if (err) return res.status(500).send('❌ Could not fetch databases');

    let html = `<h2>📂 Available MySQL Databases</h2><ul>`;
    results.forEach(row => {
      html += `<li>${row.Database}</li>`;
    });
    html += `</ul><br><a href="/">⬅️ Back to Home</a>`;
    res.send(html);
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
