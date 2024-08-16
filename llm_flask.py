from flask import Flask, request, jsonify, Response, send_from_directory
from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
import sys
import os

app = Flask(__name__, static_folder='public', static_url_path='')

llm = Ollama(model="llama3")


def create_analyze_profile_prompt():
    template = """
    
    Analyze the following profile of an elderly user in an Ambient Assisted Living (AAL) context. 
    Extract and categorize the information into the following categories:

    Goals: What does the user want or need to do/achieve?
    Preferences: What does the user like or dislike?
    Quality of Experience (QoE) Factors: Which aspects of assistive technology could positively/negatively influence the user's satisfaction?

    For each category, provide a numbered list of items. If there is insufficient information for a category, indicate "No information available".
    For QoE Factors, express each factor in positive terms. For example, use "avoid technology anxiety" instead of "technology anxiety".
    User Profile:
    {user_profile}
    Respond using the following format:

    Goals:
    [Goal 1]
    [Goal 2]
    ...

    Preferences:
    [Preference 1]
    [Preference 2]
    ...

    QoE Factors:
    [QoE Factor 1 in positive terms]
    [QoE Factor 2 in positive terms]
    ...

    After the list, provide a brief explanation (2-3 sentences) on how you identified each element, citing specific parts of the profile text.
    """
    return ChatPromptTemplate.from_template(template)


def create_generate_contribution_prompt():
    template = """
    
    Given the following test containing also the Quality of Experience (QoE) factors for an elderly user in an Ambient Assisted Living (AAL) context, 
    {identified_QoE}
    
    And given a list of IoT devices present in the environment:
    {list_of_devices}
    
    Generate the possible contribution relationships (positive or negative) from the devices to the QoE factors.

    For each device, identify how it might contribute positively or negatively to each QoE factor. Use the following notation:
    Strong positive contribution: ++
    Weak positive contribution: +
    Weak negative contribution: -
    Strong negative contribution: --

    Additionally, specify if the contribution is due to the device's usage (u) or the accuracy of its function (a).
    Provide your response in the following format:
    [Device Name]:

    [QoE Factor 1]: [++/+/-/--][u/a], Brief explanation
    [QoE Factor 2]: [++/+/-/--][u/a], Brief explanation
    ...

    Repeat for each device in the list.
    After completing the list, provide a brief explanation (2-3 sentences) of your general reasoning for assigning the contributions.
    """
    return ChatPromptTemplate.from_template(template)


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return "File not found", 404


@app.route('/analyze_profile', methods=['POST'])
def analyze_profile():
    data = request.get_json()
    user_profile = data.get('user_profile', "")
    session_id = data.get('session_id')

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    print(f"Analyzing profile for session: {session_id}")

    prompt_template = create_analyze_profile_prompt()
    final_prompt = prompt_template.format(user_profile=user_profile)

    def generate():
        for chunk in llm.stream(final_prompt):
            yield chunk

    return Response(generate(), mimetype='text/plain')


@app.route('/generate_contribution', methods=['POST'])
def generate_contribution():
    data = request.get_json()
    identified_QoE = data.get('identified_QoE', "")
    list_of_devices = data.get('list_of_devices', "")
    session_id = data.get('session_id')

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    print(f"Generating contribution for session: {session_id}")

    prompt_template = create_generate_contribution_prompt()
    final_prompt = prompt_template.format(identified_QoE=identified_QoE, list_of_devices=list_of_devices)

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