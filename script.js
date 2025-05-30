let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let selectedOption = null;
let selectedQuestions = [];
let timeLeft = 30;
let timerId;
let userAnswers = [];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('high-score').textContent = highScore;
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data;
            updateCategoryOptions();
            updateNumQuestionsOptions();
            document.getElementById('category').addEventListener('change', updateNumQuestionsOptions);
            document.getElementById('start-btn').addEventListener('click', startQuiz);
            document.getElementById('next-btn').addEventListener('click', nextQuestion);
            document.getElementById('restart-btn').addEventListener('click', restartQuiz);
        })
        .catch(error => console.error('Lỗi tải câu hỏi:', error));
});

function updateCategoryOptions() {
    const select = document.getElementById('category');
    select.innerHTML = '<option value="all">Tất cả</option>';
    const categories = [...new Set(questions.map(q => q.category))];
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
}

function updateNumQuestionsOptions() {
    const category = document.getElementById('category').value;
    const filteredQuestions = category === 'all' ? questions : questions.filter(q => q.category === category);
    const select = document.getElementById('num-questions');
    select.innerHTML = '';
    for (let i = 1; i <= filteredQuestions.length; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        select.appendChild(option);
    }
}

function startQuiz() {
    const category = document.getElementById('category').value;
    const numQuestions = parseInt(document.getElementById('num-questions').value);
    const filteredQuestions = category === 'all' ? questions : questions.filter(q => q.category === category);
    selectedQuestions = shuffleArray([...filteredQuestions]).slice(0, numQuestions);
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    document.getElementById('score-value').textContent = score;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz').style.display = 'block';
    updateProgress();
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= selectedQuestions.length) {
        showResult();
        return;
    }

    const questionData = selectedQuestions[currentQuestionIndex];
    document.getElementById('question').innerText = `Câu ${questionData.id}: ${questionData.question}`;
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    document.getElementById('feedback').innerText = '';
    document.getElementById('next-btn').disabled = true;
    selectedOption = null;
    timeLeft = 30;
    document.getElementById('time-left').textContent = timeLeft;

    startTimer();

    const optionKeys = shuffleArray(Object.keys(questionData.options).filter(key => questionData.options[key] !== ''));
    optionKeys.forEach(key => {
        const button = document.createElement('button');
        button.className = 'option';
        button.innerText = `${key}. ${questionData.options[key]}`;
        button.onclick = () => selectOption(button, key);
        optionsDiv.appendChild(button);
    });

    updateProgress();
}

function startTimer() {
    clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerId);
            selectOption(null, null);
        }
    }, 1000);
}

function selectOption(button, option) {
    if (selectedOption) return;
    selectedOption = option;
    clearInterval(timerId);

    if (button) {
        document.querySelectorAll('.option').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
    }

    const correct = selectedQuestions[currentQuestionIndex].correct;
    const feedback = document.getElementById('feedback');
    if (option === null) {
        feedback.innerText = `Hết thời gian! Đáp án đúng: ${correct}. ${selectedQuestions[currentQuestionIndex].options[correct]}`;
        feedback.style.color = 'red';
        userAnswers.push({ id: selectedQuestions[currentQuestionIndex].id, selected: null, correct: false });
    } else if (option === correct) {
        feedback.innerText = 'Đúng!';
        feedback.style.color = 'green';
        score++;
        document.getElementById('score-value').textContent = score;
        userAnswers.push({ id: selectedQuestions[currentQuestionIndex].id, selected: option, correct: true });
        // new Audio('correct.mp3').play(); // Bỏ chú thích nếu thêm âm thanh
    } else {
        feedback.innerText = `Sai! Đáp án đúng: ${correct}. ${selectedQuestions[currentQuestionIndex].options[correct]}`;
        feedback.style.color = 'red';
        userAnswers.push({ id: selectedQuestions[currentQuestionIndex].id, selected: option, correct: false });
        // new Audio('incorrect.mp3').play(); // Bỏ chú thích nếu thêm âm thanh
    }
    document.getElementById('next-btn').disabled = false;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        document.getElementById('high-score').textContent = highScore;
    }
}

function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
}

function updateProgress() {
    document.getElementById('progress-value').innerText = `${currentQuestionIndex + 1}/${selectedQuestions.length}`;
}

function showResult() {
    clearInterval(timerId);
    document.getElementById('quiz').style.display = 'none';
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    document.getElementById('score').innerText = `Bạn đúng ${score}/${selectedQuestions.length} câu (${(score/selectedQuestions.length*100).toFixed(2)}%) | Điểm cao nhất: ${highScore}`;

    const detailedResults = document.getElementById('detailed-results');
    detailedResults.innerHTML = '<h3>Chi tiết câu trả lời:</h3>';
    userAnswers.forEach((answer, index) => {
        const question = selectedQuestions[index];
        const resultText = answer.correct
            ? `Câu ${question.id}: Đúng (Bạn chọn ${answer.selected})`
            : `Câu ${question.id}: Sai (Bạn chọn ${answer.selected || 'Không chọn'}, Đáp án đúng: ${question.correct})`;
        const p = document.createElement('p');
        p.innerText = resultText;
        p.style.color = answer.correct ? 'green' : 'red';
        detailedResults.appendChild(p);
    });

    const ctx = document.getElementById('scoreChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Điểm hiện tại', 'Tổng câu hỏi'],
            datasets: [{
                label: 'Kết quả Quiz',
                data: [score, selectedQuestions.length],
                backgroundColor: ['#28a745', '#007BFF'],
                borderColor: ['#1f7a33', '#0056b3'],
                borderWidth: 1
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Điểm' } } },
            plugins: { legend: { display: true }, title: { display: true, text: 'Kết quả Quiz' } }
        }
    });
}

function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    selectedOption = null;
    selectedQuestions = [];
    userAnswers = [];
    document.getElementById('quiz').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
}
</xArtifact>

**Thay đổi**:
- **Xáo trộn câu hỏi**: Thêm `selectedQuestions = shuffleArray([...filteredQuestions]).slice(0, numQuestions)` trong `startQuiz`.
- **Chọn số lượng câu hỏi**: Thêm `updateNumQuestionsOptions` để tạo dropdown động, cập nhật khi thay đổi danh mục.
- **Thay đổi vị trí đáp án**: Xáo trộn khóa đáp án trong `loadQuestion`.
- **Chấm điểm chi tiết**: Lưu câu trả lời vào `userAnswers` và hiển thị chi tiết trong `showResult`.
- **Điểm cao nhất**: Sử dụng `localStorage` để lưu và hiển thị điểm cao nhất.
- **Biểu đồ kết quả**: Thêm Chart.js để vẽ biểu đồ cột.
- **Thanh tiến độ**: Thêm `updateProgress` để hiển thị tiến độ.
- **Danh mục câu hỏi**: Thêm dropdown danh mục và lọc câu hỏi theo `category`.
- **Hiệu ứng âm thanh**: Mã âm thanh được chú thích (bỏ chú thích nếu bạn thêm tệp `correct.mp3` và `incorrect.mp3`).

#### Bước 5: Cập nhật `style.css`
Cập nhật CSS để hỗ trợ giao diện mới.

<xaiArtifact artifact_id="8681e5ba-8cad-4030-b25a-9a4765fdde02" artifact_version_id="f0e38ae8-269b-4797-81b7-ba88e85931ab" title="style.css" contentType="text/css">
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f4f4f4;
}

.container {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

h1 {
    text-align: center;
    font-size: 1.5em;
}

#start-screen, #quiz, #result {
    margin-top: 20px;
}

#question {
    font-size: 1.2em;
    margin-bottom: 20px;
}

#progress, #timer, #score {
    font-size: 1.1em;
    margin-bottom: 10px;
}

.option {
    display: block;
    width: 100%;
    padding: 10px;
    margin: 5px 0;
    background: #eee;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    text-align: left;
}

.option:hover {
    background: #ddd;
}

.option.selected {
    background: #007bff;
    color: white;
}

#feedback {
    margin: 10px 0;
    font-weight: bold;
}

#next-btn, #start-btn, #restart-btn {
    display: block;
    width: 100%;
    padding: 10px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;
}

#next-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

#result {
    text-align: center;
}

#detailed-results {
    margin-top: 20px;
    text-align: left;
}

#scoreChart {
    margin: 20px auto;
}

select {
    padding: 5px;
    margin: 10px;
    font-size: 1em;
}

@media (min-width: 768px) {
    h1 {
        font-size: 2em;
    }
    .container {
        padding: 30px;
    }
}
