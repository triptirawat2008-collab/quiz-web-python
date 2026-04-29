from flask import Flask, render_template, jsonify, request
import json
import random
import os

app = Flask(__name__)

def load_questions():
    file_path = os.path.join(os.path.dirname(__file__), 'questions.json')
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_questions', methods=['GET'])
def get_questions():
    questions = load_questions()
    random.shuffle(questions)
    
    # Optional: shuffle options as well to make it more dynamic
    for q in questions:
        random.shuffle(q['options'])
        
    return jsonify(questions)

@app.route('/submit_score', methods=['POST'])
def submit_score():
    data = request.json
    user_answers = data.get('answers', [])
    
    questions = load_questions()
    
    score = 0
    total = len(questions)
    
    # Calculate score
    for i, q in enumerate(questions):
        # The frontend provides an array of answers corresponding to the order the shuffled questions were given.
        # We need the frontend to send the original question text or index to verify properly, 
        # OR we just compare user answers if frontend sends [{'question': '...', 'answer': '...'}, ...]
        pass

    # A better approach for /submit_score:
    # Let the frontend send a dictionary of { "Question text": "Selected Answer" }
    score = 0
    total = len(user_answers)
    
    # Create a quick lookup dictionary for correct answers
    correct_answers_dict = { q['question']: q['correct_answer'] for q in questions }
    
    for ans_obj in user_answers:
        q_text = ans_obj.get('question')
        selected = ans_obj.get('answer')
        
        if correct_answers_dict.get(q_text) == selected:
            score += 1
            
    percentage = (score / total) * 100 if total > 0 else 0
    
    message = "Try Again"
    if percentage >= 90:
        message = "Excellent!"
    elif percentage >= 70:
        message = "Good!"
    elif percentage >= 50:
        message = "Not Bad!"
        
    return jsonify({
        'score': score,
        'total': total,
        'percentage': round(percentage, 2),
        'message': message
    })

if __name__ == '__main__':
    app.run(debug=True)
