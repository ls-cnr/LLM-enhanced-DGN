document.addEventListener('DOMContentLoaded', function() {
    let sessionId = uuid.v4();

    const userProfileTextarea = document.getElementById('user-profile');
    const availableDevicesTextarea = document.getElementById('available-devices');
    const profileAnalysisResult = document.getElementById('profile-analysis-result');
    const generatedContributionsResult = document.getElementById('generated-contributions-result');
    const analyzeProfileButton = document.getElementById('analyze-profile');
    const generateContributionsButton = document.getElementById('generate-contributions');

    // Inizialmente disabilita entrambi i pulsanti
    analyzeProfileButton.disabled = true;
    generateContributionsButton.disabled = true;

    // Abilita/disabilita il pulsante "Analyze Profile" in base al contenuto di user_profile
    userProfileTextarea.addEventListener('input', function() {
        analyzeProfileButton.disabled = this.value.trim() === '';
    });

    // Abilita/disabilita il pulsante "Generate Contributions" in base alle condizioni
    function checkGenerateButtonState() {
        generateContributionsButton.disabled =
            profileAnalysisResult.textContent.trim() === '' ||
            availableDevicesTextarea.value.trim() === '';
    }

    availableDevicesTextarea.addEventListener('input', checkGenerateButtonState);

    // Collegamento dei pulsanti alle rispettive funzioni
    analyzeProfileButton.addEventListener('click', () => performTask('analyze'));
    generateContributionsButton.addEventListener('click', () => performTask('generate'));

    async function performTask(task) {
        let endpoint, requestBody, resultElement;

        if (task === 'analyze') {
            endpoint = 'http://127.0.0.1:5000/analyze_profile';
            requestBody = JSON.stringify({
                user_profile: userProfileTextarea.value,
                session_id: sessionId
            });
            resultElement = profileAnalysisResult;
        } else {
            endpoint = 'http://127.0.0.1:5000/generate_contribution';
            requestBody = JSON.stringify({
                identified_QoE: profileAnalysisResult.textContent,
                list_of_devices: availableDevicesTextarea.value,
                session_id: sessionId
            });
            resultElement = generatedContributionsResult;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: requestBody,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            resultElement.innerHTML = ''; // Clear previous content

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                while (buffer.indexOf('\n') !== -1) {
                    const line = buffer.slice(0, buffer.indexOf('\n'));
                    buffer = buffer.slice(buffer.indexOf('\n') + 1);
                    await typewriterEffect(resultElement, marked.parse(line));
                }
            }

            if (buffer) {
                await typewriterEffect(resultElement, marked.parse(buffer));
            }

            // Dopo l'analisi del profilo, controlla lo stato del pulsante "Generate Contributions"
            if (task === 'analyze') {
                checkGenerateButtonState();
            }

        } catch (error) {
            console.error("An error occurred:", error);
            resultElement.textContent = 'An error occurred during the operation.';
        }
    }

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
                scrollToBottom(element);
            }
        }
        scrollToBottom(element);
    }

    function scrollToBottom(element) {
        element.scrollTop = element.scrollHeight;
    }

    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            copyToClipboard(targetId);
        });
    });

    document.querySelector('.new-session-button').addEventListener('click', newSession);

    function newSession() {
        sessionId = uuid.v4();
        userProfileTextarea.value = '';
        availableDevicesTextarea.value = '';
        profileAnalysisResult.innerHTML = '';
        generatedContributionsResult.innerHTML = '';
        analyzeProfileButton.disabled = true;
        generateContributionsButton.disabled = true;
    }

    function copyToClipboard(targetId) {
        const text = document.getElementById(targetId).innerText;
        navigator.clipboard.writeText(text).then(() => {
            const copyButton = document.querySelector(`button[data-target="${targetId}"]`);
            const copyAlert = copyButton.querySelector('.copy-alert');
            copyAlert.style.display = 'block';
            copyAlert.style.opacity = '1';

            setTimeout(() => {
                copyAlert.style.opacity = '0';
                setTimeout(() => {
                    copyAlert.style.display = 'none';
                }, 300); // Attende che la transizione di opacità sia completata
            }, 2000); // Mostra il tooltip per 2 secondi
        });
    }
});