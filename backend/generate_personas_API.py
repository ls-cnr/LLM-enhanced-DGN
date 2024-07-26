from langchain_community.llms import Ollama
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables import RunnableWithMessageHistory
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys

llm = Ollama(model="llama3")

def create_chain():
    template = """
    {design_objective}
    Assume the role of a User-centered Designer who is building Personas to design the system.
    Generate a new 'persona' as a user of my application. The persona lives in {country}.
    {features}
    Define a short biography including personal interests/motivations, and relationships with family and friends.
    Print only the persona using this template where instructions are guven between [], don't use preambles, courtesy phrases or concluding sentences:
    **PERSONA: [NAME]**
    *Personal Information*
    Age: [AGE]
    Gender [GENDER]
    Nationality: [NATIONALITY]
    *Personality*
    [3 ADJECTIVES THAT DESCRIBE THE PERSONA]
    *Biography*
    [A BRIEF PERSONAL HISTORY. WRITTEN IN FIRST PERSON (MAX 80 WORDS)]
    [A TYPICAL DAY. WRITTEN IN FIRST PERSON (MAX 80 WORDS)]
    """

    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | llm | StrOutputParser()

    return RunnableWithMessageHistory(
        chain,
        lambda session_id: ChatMessageHistory(key=session_id),
        input_messages_key="input",
        history_messages_key="history",
    )

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

chain_with_history = create_chain()

@app.route('/generate', methods=['POST'])
def handle_generate():
    data = request.get_json()
    nationality = data.get('nationality')
    objective = data.get('_objectives', "")
    features = data.get('features', "")
    session_id = data.get('session_id')

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    print(f"Generating for {nationality} with features: {features}")
    print(f"Session ID: {session_id}")

    # Crea il prompt finale
    final_prompt = {
        "design_objective": objective,
        "country": nationality,
        "features": features,
        "input": f"Generate a persona for {nationality}"
    }

    # Stampa il prompt finale valorizzato
    #formatted_prompt = chain_with_history.chain.input_messages_key.format(**final_prompt)
    #print("Prompt finale valorizzato:", formatted_prompt)

    persona = chain_with_history.invoke(
        final_prompt,
        config={"configurable": {"session_id": session_id}}
    )

    print("Generated persona:", persona)

    return jsonify({"result": persona})

@app.route('/test', methods=['GET'])
def test():
    return "Il server funziona!"

if __name__ == '__main__':
    print("Avvio del server Flask...", file=sys.stderr)
    app.run(debug=True, port=5000)
