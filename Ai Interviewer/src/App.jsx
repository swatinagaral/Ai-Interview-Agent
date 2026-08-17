
import { useState } from "react";
import "./App.css";

function App() {
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("");

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answer, setAnswer] = useState("");

  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  const [answers, setAnswers] = useState([]);

  const [summary, setSummary] = useState("");

  const [interviewFinished, setInterviewFinished] = useState(false);

  // ---------------- START INTERVIEW ----------------

  const handleClick = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/startInterview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            level,
          }),
        }
      );

      const data = await response.json();

      setQuestions(data.questions);
      setCurrentQuestion(0);

      setAnswer("");
      setScore("");
      setFeedback("");

      setAnswers([]);

      setInterviewFinished(false);
      setSummary("");
    } catch (error) {
      console.log(error);
    }
  };

  // ---------------- SUBMIT ANSWER ----------------

  const submitAnswer = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/evaluateAnswer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: questions[currentQuestion],
            answer,
          }),
        }
      );

      const data = await response.json();

      setScore(data.score);
      setFeedback(data.feedback);

      const updatedAnswers = [
        ...answers,
        {
          question: questions[currentQuestion],
          answer: answer,
          score: data.score,
          feedback: data.feedback,
        },
      ];

      setAnswers(updatedAnswers);

      setTimeout(async () => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);

          setAnswer("");
          setScore("");
          setFeedback("");
        } else {
          finishInterview(updatedAnswers);
        }
      }, 2000);
    } catch (error) {
      console.log(error);
    }
  };

  // ---------------- FINISH INTERVIEW ----------------

  const finishInterview = async (allAnswers) => {
    try {
      const response = await fetch(
        "http://localhost:5000/finishInterview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: allAnswers,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
      alert(data.error);
      return;
  }

      setSummary(data.summary);

      setInterviewFinished(true);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>

      <h1>AI INTERVIEWER</h1>

      <label>Select Your Role : </label>

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="">Select</option>

        <option value="React Developer">
          React Developer
        </option>

        <option value="Java Developer">
          Java Developer
        </option>

        <option value="Web Developer">
          Web Developer
        </option>
      </select>

      <label>Select Your Level : </label>

      <select
        value={level}
        onChange={(e) => setLevel(e.target.value)}
      >
        <option value="">Select</option>

        <option value="Beginner">
          Beginner
        </option>

        <option value="Intermediate">
          Intermediate
        </option>

        <option value="Experienced">
          Experienced
        </option>
      </select>

      <button
  onClick={handleClick}
  disabled={!role || !level}
>
  Start Interview
</button>

      <hr />

      {questions.length > 0 && !interviewFinished && (
        <>

          <h2>
            Question {currentQuestion + 1} / {questions.length}
          </h2>

          <h3>{questions[currentQuestion]}</h3>

          <textarea
            rows="6"
            cols="60"
            value={answer}
            placeholder="Type your answer..."
            onChange={(e) => setAnswer(e.target.value)}
          />

          <br />
          <br />

          <button onClick={submitAnswer}>
            {currentQuestion === questions.length - 1
              ? "Finish Interview"
              : "Submit & Next"}
          </button>

          <br />
          <br />

          {score && (
            <h3>Score : {score}/10</h3>
          )}

          {feedback && (
            <p>{feedback}</p>
          )}

        </>
      )}

      {interviewFinished && (
        <>

          <h2>
            Interview Completed
          </h2>

          <h3>Transcript</h3>

          {answers.map((item, index) => (
            <div
              key={index}
              style={{
                border: "1px solid gray",
                marginBottom: "15px",
                padding: "10px",
              }}
            >
              <h4>
                Question {index + 1}
              </h4>

              <p>
                <b>Question :</b> {item.question}
              </p>

              <p>
                <b>Your Answer :</b> {item.answer}
              </p>

              <p>
                <b>Score :</b> {item.score}/10
              </p>

              <p>
                <b>Feedback :</b> {item.feedback}
              </p>
            </div>
          ))}

          <hr />

          <h2>Final Evaluation</h2>

          <pre
            style={{
              whiteSpace: "pre-wrap",
            }}
          >
            {summary}
          </pre>

        </>
      )}
    </div>
  );
}

export default App;