require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // Promise-based API
const bodyParser = require('body-parser');
const { DateTime } = require('luxon');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;
const hostname = os.hostname();
const APP_VERSION = "v4.0.0";

app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Utility to format time in Denver
const getDenverTime = (jsDate) => {
  return DateTime.fromJSDate(jsDate, { zone: 'utc' })
    .setZone('America/Denver')
    .toFormat('yyyy-LL-dd HH:mm:ss ZZZZ');
};

// Render HTML layout with version at top-right
const renderLayout = (title, body) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; background-color: #f6f6f6; color: #333; padding: 2rem; }
  h1, h2, h3 { color: #2c3e50; margin: 0; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .version { font-size: 1.2rem; font-weight: bold; color: #e74c3c; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
  th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
  th { background-color: #e0e0e0; }
  a { color: #3498db; text-decoration: none; margin-right: 0.5rem; }
  button { padding: 0.3rem 0.6rem; cursor: pointer; }
  form { display: inline; }
</style>
</head>
<body>
<div class="header">
  <h1>${title}</h1>
  <span class="version">Version: ${APP_VERSION}</span>
</div>
${body}
</body>
</html>
`;

// Home - List users
app.get('/', async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users');
    const [[{ now }]] = await db.query('SELECT NOW() as now');
    const denverTime = getDenverTime(now);

    let html = `<h2>Users from database: <code>${process.env.DB_NAME}</code></h2>`;
    html += `<p>🖥️ Running on host: <code>${hostname}</code></p>`;
    html += `<p>✅ Fetched ${users.length} user(s) at ${denverTime} (Denver time)</p>`;

    if (users.length) {
      html += `<table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Actions</th></tr>
        </thead>
        <tbody>`;
      users.forEach(user => {
        html += `<tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>
            <a href="/edit/${user.id}">Edit</a>
            <form action="/delete/${user.id}" method="POST" onsubmit="return confirm('Are you sure?');">
              <button type="submit">Delete</button>
            </form>
          </td>
        </tr>`;
      });
      html += `</tbody></table>`;
    } else {
      html += `<p>No users found.</p>`;
    }

    html += `<a href="/add">➕ Add New User</a> | <a href="/databases">📂 View Databases</a>`;

    res.send(renderLayout('Users', html));
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send(renderLayout('Error', '<p>❌ Internal Server Error</p>'));
  }
});

// Add user form
app.get('/add', (req, res) => {
  const html = `
    <h2>Add User</h2>
    <form action="/add" method="POST">
      <label>Name:</label><br>
      <input type="text" name="name" required><br>
      <label>Email:</label><br>
      <input type="email" name="email" required><br><br>
      <button type="submit">➕ Add User</button>
    </form>
    <br><a href="/">⬅️ Back to Home</a>
  `;
  res.send(renderLayout('Add User', html));
});

// Add user handler
app.post('/add', async (req, res) => {
  const { name, email } = req.body;
  try {
    await db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
    res.redirect('/');
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).send(renderLayout('Error', '<p>❌ Error inserting user</p>'));
  }
});

// Edit user form
app.get('/edit/:id', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!results.length) return res.status(404).send(renderLayout('Error', '<p>❌ User not found</p>'));

    const user = results[0];
    const html = `
      <h2>Edit User</h2>
      <form action="/edit/${user.id}" method="POST">
        <label>Name:</label><br>
        <input type="text" name="name" value="${user.name}" required><br>
        <label>Email:</label><br>
        <input type="email" name="email" value="${user.email}" required><br><br>
        <button type="submit">💾 Save Changes</button>
      </form>
      <br><a href="/">⬅️ Back to Home</a>
    `;
    res.send(renderLayout('Edit User', html));
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).send(renderLayout('Error', '<p>❌ Internal Server Error</p>'));
  }
});

// Update user
app.post('/edit/:id', async (req, res) => {
  const { name, email } = req.body;
  try {
    await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.params.id]);
    res.redirect('/');
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).send(renderLayout('Error', '<p>❌ Error updating user</p>'));
  }
});

// Delete user
app.post('/delete/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).send(renderLayout('Error', '<p>❌ Error deleting user</p>'));
  }
});

// List databases
app.get('/databases', async (req, res) => {
  try {
    const [databases] = await db.query('SHOW DATABASES');
    let html = `<h2>📂 Available MySQL Databases</h2><ul>`;
    databases.forEach(db => html += `<li>${db.Database}</li>`);
    html += `</ul><br><a href="/">⬅️ Back to Home</a>`;
    res.send(renderLayout('Databases', html));
  } catch (err) {
    console.error('Error fetching databases:', err);
    res.status(500).send(renderLayout('Error', '<p>❌ Could not fetch databases</p>'));
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
