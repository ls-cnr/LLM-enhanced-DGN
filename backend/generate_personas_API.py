from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_message_histories import ChatMessageHistory
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import sys
import asyncio

llm = Ollama(model="llama3")

def create_prompt():
    template = """
    {design_objective}
    Assume the role of a User-centered Designer who is building Personas to design the system.
    Generate 'persona' as a archetypal user of my application. The persona is from {country}.
    Generate these features: {features}, eansuring they are original and different from any other previously generated.
    Define a short biography including personal interests/motivations, and relationships with family and friends.
    Print in English only the persona, don't use preambles, courtesy phrases or concluding sentences.
    Use the following template where instructions are between []:
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

    return ChatPromptTemplate.from_template(template)

    #prompt = ChatPromptTemplate.from_template(template)
    #chain = prompt | llm | StrOutputParser()

    #return RunnableWithMessageHistory(
    #    chain,
    #    lambda session_id: ChatMessageHistory(key=session_id),
    #    input_messages_key="input",
    #    history_messages_key="history",
    #)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

#chain_with_history = create_chain()
prompt_template = create_prompt()


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

    final_prompt = prompt_template.format(
        design_objective=objective,
        country=nationality,
        features=features
    )

    def generate():
        for chunk in llm.stream(final_prompt):
            yield chunk

    return Response(generate(), mimetype='text/plain')


@app.route('/test', methods=['GET'])
def test():
    return "Il server funziona!"

if __name__ == '__main__':
    print("Avvio del server Flask...", file=sys.stderr)
    app.run(debug=True, port=5000)
