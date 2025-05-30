import pandas as pd
import json

# Đọc tệp Excel
excel_file = 'questions.xlsx'  # Thay bằng đường dẫn tệp Excel của bạn
df = pd.read_excel(excel_file)

# Chuyển đổi thành định dạng JSON
questions = []
for index, row in df.iterrows():
    question = {
        'id': int(row['id']),
        'question': str(row['question']),
        'options': {
            'A': str(row['A']),
            'B': str(row['B']),
            'C': str(row['C']),
            'D': str(row['D']),
            'E': str(row.get('E', '')),
        },
        'correct': str(row['correct'])
    }
    questions.append(question)

# Lưu vào questions.json
with open('questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=4)

print("Đã tạo questions.json thành công!")
