document.getElementById('personaForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nationality = document.getElementById('nationality').value;
    const _objectives = document.getElementById('objectives').value;
    const features = document.getElementById('features').value;

    console.log('Nazionalità:', nationality);
    console.log('Objectives:', _objectives);
    console.log('Features:', features);
    console.log('Session ID:', sessionId);

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nationality, _objectives, features, session: sessionId }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const unformattedText = data.result;

        let formattedText;
        if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
            formattedText = marked.parse(unformattedText.replace(/\n/g, '<br>'));
        } else {
            // Fallback semplice se marked non è disponibile
            formattedText = unformattedText.replace(/\n/g, '<br>');
        }

        document.getElementById('result').innerHTML = formattedText;


    } catch (error) {
        console.error("Si è verificato un problema con l'operazione di fetch:", error);
        document.getElementById('result').textContent = 'Si è verificato un errore durante la generazione della persona.';
    }
});
