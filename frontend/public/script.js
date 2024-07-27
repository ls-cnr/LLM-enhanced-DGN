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

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const resultElement = document.getElementById('result');
        resultElement.innerHTML = ''; // Clear previous content

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, newlineIndex);
                buffer = buffer.slice(newlineIndex + 1);

                // Render the Markdown and append to the result element
                await typewriterEffect(resultElement, marked.parse(line));
            }
        }

        // Process any remaining content in the buffer
        if (buffer) {
            await typewriterEffect(resultElement, marked.parse(buffer));
        }


    } catch (error) {
        console.error("Si è verificato un problema con l'operazione di fetch:", error);
        document.getElementById('result').textContent = 'Si è verificato un errore durante la generazione della persona.';
    }
});

async function typewriterEffect(element, html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    for (let node of temp.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            for (let char of node.textContent) {
                element.appendChild(document.createTextNode(char));
                await new Promise(resolve => setTimeout(resolve, 20)); // Adjust delay as needed
            }
        } else {
            element.appendChild(node);
            await new Promise(resolve => setTimeout(resolve, 20)); // Adjust delay as needed
        }
    }
    //element.appendChild(document.createElement('br'));
}
