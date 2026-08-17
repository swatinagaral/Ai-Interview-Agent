
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
// const Groq = require("groq-sdk");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});



// const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY,
// });

// ================= QUESTIONS =================

const interviewQuestions = {
  "React Developer": {
    Beginner: [
      "What is JSX?",
      "What are Props?",
      "What is State?",
      "What is Virtual DOM?",
      "What is useEffect?"
    ],

    Intermediate: [
      "Explain React Hooks.",
      "What is Context API?",
      "Difference between useEffect and useLayoutEffect?",
      "Explain React Router.",
      "How does React reconciliation work?"
    ],

    Experienced: [
      "Explain React Fiber.",
      "How do you optimize React performance?",
      "Explain memoization.",
      "What is Server Side Rendering?",
      "Explain code splitting."
    ]
  },

  "Java Developer": {
    Beginner: [
      "What is JVM?",
      "Difference between JDK and JRE?",
      "Explain OOP concepts.",
      "What is Inheritance?",
      "What is Polymorphism?"
    ],

    Intermediate: [
      "Explain Collections.",
      "What is Exception Handling?",
      "Difference between HashMap and Hashtable?",
      "Explain Multithreading.",
      "What is Synchronization?"
    ],

    Experienced: [
      "Explain JVM Memory.",
      "Garbage Collection?",
      "What are Streams?",
      "Explain Spring Boot.",
      "Dependency Injection?"
    ]
  },

  "Web Developer": {
    Beginner: [
      "What is HTML?",
      "Difference between HTML and HTML5?",
      "What is CSS?",
      "What is JavaScript?",
      "What is Responsive Design?"
    ],

    Intermediate: [
      "What is the difference between == and === ?",
      "Explain the CSS Box Model.",
      "What is Event Delegation?",
      "Difference between localStorage and sessionStorage?",
      "How do you make a website responsive?"
    ],

    Experienced: [
      "Explain SSR vs CSR.",
      "How do you optimize website performance?",
      "What is CORS?",
      "Authentication vs Authorization?",
      "How do you prevent XSS and CSRF?"
    ]
  }
};

// ================= HOME =================

app.get("/", (req, res) => {
  res.send("Backend Running");
});

// ================= START INTERVIEW =================


app.post("/startInterview", (req, res) => {

  const { role, level } = req.body;

  // Check if role or level is missing
  if (!role || !level) {
    return res.status(400).json({
      error: "Please select a role and level."
    });
  }

  // Check whether the role exists
  if (!interviewQuestions[role]) {
    return res.status(400).json({
      error: "Invalid role selected."
    });
  }

  // Check whether the level exists
  if (!interviewQuestions[role][level]) {
    return res.status(400).json({
      error: "Invalid level selected."
    });
  }

  const questions = interviewQuestions[role][level];

  res.json({
    questions
  });

});

// ================= EVALUATE ANSWER =================

app.post("/evaluateAnswer", async (req, res) => {


  const { question, answer } = req.body;
//  
 const invalidAnswers = [
    "",
    "hi",
    "hello",
    "ok",
    "okay",
    "idk",
    "i don't know",
    "dont know",
    ".",
    ".."
  ];

  if (
    invalidAnswers.includes(answer.trim().toLowerCase()) ||
    answer.trim().length < 3
  ) {
    return res.json({
      score: 0,
      feedback: "No valid technical answer was provided."
    });
  }


const prompt = `
You are an expert technical interviewer.

Interview Question:
${question}

Candidate Answer:
${answer}

Evaluation Rules:

1. If the answer is empty, blank, only spaces, or meaningless (like "hi", "hello", "ok", "idk", ".", etc.),
   return:

{
  "score": 0,
  "feedback": "No valid answer was provided."
}

2. Score from 0 to 10.

Scoring:

10 = Excellent
8-9 = Good
6-7 = Average
3-5 = Poor
0-2 = Incorrect or No Answer

Return ONLY valid JSON.

{
  "score": 8,
  "feedback": "Short feedback in 2-3 lines."
}
`;

  try {
//     const response = await groq.chat.completions.create({
//   model: "llama-3.3-70b-versatile",
//   messages: [
//     {
//       role: "user",
//       content: prompt,
//     },
//   ],
// });

    const response = await ai.models.generateContent({

      model: "gemini-3.5-flash",

      contents: prompt

    });

    //  response.choices[0].message.content;
      let result =response.candidates[0].content.parts[0].text;

    result = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const evaluation = JSON.parse(result);

    res.json(evaluation);

  } catch (error) {

    console.log(error);

    res.status(500).json({

      error: error.message

    });

  }

});



app.post("/finishInterview", async (req, res) => {

  const { answers } = req.body;
  // Create validAnswers FIRST
    const validAnswers = answers.filter(
        (item) => item.answer && item.answer.trim() !== ""
    );
    if (validAnswers.length === 0) {
        return res.json({
            summary: `
                Overall Score: 0/100

                Strengths:
                - No valid answers were submitted.

                Weaknesses:
                - Candidate did not answer any interview questions.

                Topics to Improve:
                - Technical concepts
                - Communication
                - Problem solving

                Final Recommendation:
                Please answer the interview questions to receive a meaningful evaluation.
                `
                        });
                    }

  const prompt = `
You are an AI Interviewer.

Below is a complete interview transcript.

${JSON.stringify(validAnswers)}

Generate

Overall Score

Strengths

Weaknesses

Topics to Improve

Final Recommendation

Keep it short and professional.
`;

  try {
//     const response = await groq.chat.completions.create({

//   model: "llama-3.3-70b-versatile",

//   messages: [
//     {
//       role: "user",
//       content: prompt,
//     },
//   ],

// });

// const summary = response.choices[0].message.content;

    const response = await ai.models.generateContent({

      model: "gemini-3.5-flash",

      contents: prompt

    });

    const summary =
      response.candidates[0].content.parts[0].text;

    res.json({

      summary

    });

  }

  catch (error) {

    console.log(error);
     if (error.status === 429) {
        return res.status(429).json({
            error: "Gemini API quota exceeded. Please wait one minute and try again."
        });
    }
//     if (error.status === 429) {
//     return res.status(429).json({
//         error: "Groq rate limit exceeded. Please try again shortly."
//     });
// }

    res.status(500).json({

      error: error.message

    });

  }

});

// ================= SERVER =================

app.listen(port, () => {

  console.log("Server Running on Port 5000");

});