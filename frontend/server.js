const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate', async (req, res) => {
  try {
    const { nationality, _objectives, features, session } = req.body;
    const requestBody = JSON.stringify({ nationality, _objectives, features, session_id: session });
    console.log('Invio richiesta a Flask con:', requestBody );

    // Invoca il servizio Python
    const pythonResponse = await fetch('http://127.0.0.1:5000/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    if (!pythonResponse.ok) {
      throw new Error(`HTTP error! status: ${pythonResponse.status}`);
    }

    // Imposta gli header per lo streaming
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked'
    });

    // Inoltro dello stream di risposta
    pythonResponse.body.pipe(res);

    pythonResponse.body.on('end', () => {
      res.end();
    });
    
  } catch (error) {
    console.error('Errore durante la generazione della persona:', error);
    res.status(500).json({ error: 'Si è verificato un errore durante la generazione della persona.' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
