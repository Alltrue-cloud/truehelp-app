
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const FAC_FILE = path.join(__dirname, 'data', 'facilities.json');
const SUB_FILE = path.join(__dirname, 'data', 'subscriptions.json');

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file)); } catch { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const subs = readJSON(SUB_FILE);
  subs.push({ id: uuidv4(), email, date: new Date().toISOString() });
  writeJSON(SUB_FILE, subs);
  res.status(201).json({ success: true });
});

app.post('/api/facilities', (req, res) => {
  const list = readJSON(FAC_FILE);
  const f = {
    id: uuidv4(),
    name: req.body.facility_name || '',
    description: req.body.description || '',
    services: (req.body.services||'').split(',').map(s=>s.trim()),
    insurance: (req.body.insurance||'').split(',').map(i=>i.trim()),
    levels: (req.body.levels||'').split(',').map(l=>l.trim()),
    featured: !!req.body.featured,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  list.push(f); writeJSON(FAC_FILE, list);
  res.status(201).json(f);
});

app.get('/api/facilities', (req, res) => res.json(readJSON(FAC_FILE)));
app.get('/api/facilities/:id', (req, res) => {
  const f = readJSON(FAC_FILE).find(x=>x.id===req.params.id);
  return f ? res.json(f) : res.status(404).json({ error:'Not found' });
});
app.put('/api/facilities/:id', (req, res) => {
  const list = readJSON(FAC_FILE);
  const idx = list.findIndex(x=>x.id===req.params.id);
  if (idx<0) return res.status(404).json({ error:'Not found' });
  const old = list[idx];
  const upd = {
    ...old,
    name: req.body.facility_name||old.name,
    description: req.body.description||old.description,
    services: req.body.services?req.body.services.split(',').map(s=>s.trim()):old.services,
    insurance: req.body.insurance?req.body.insurance.split(',').map(i=>i.trim()):old.insurance,
    levels: req.body.levels?req.body.levels.split(',').map(l=>l.trim()):old.levels,
    featured: typeof req.body.featured==='boolean'?req.body.featured:old.featured,
    updated_at: new Date().toISOString()
  };
  list[idx]=upd; writeJSON(FAC_FILE, list);
  res.json(upd);
});

app.listen(PORT, ()=>console.log(`TrueHelp API listening on ${PORT}`));
