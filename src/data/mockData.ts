export interface User {
  id: string;
  username: string;
  password: string;
  role: "admin" | "college" | "student";
  name: string;
  collegeId?: string;
}

export interface College {
  id: string;
  name: string;
  code: string;
  username: string;
  password: string;
  studentCount: number;
}

export interface Student {
  id: string;
  name: string;
  username: string;
  password: string;
  collegeId: string;
  collegeName: string;
  email: string;
}

export interface Question {
  id: string;
  text: string;
  type: "MCQ" | "MSQ" | "NAT";
  options?: string[];
  correctAnswer: string | string[] | number;
  marks: number;
  negativeMarks: number;
  imageUrl?: string;
}

export interface TestSection {
  id: string;
  name: string;
  examId: string;
  duration: number; // minutes
  questions: Question[];
  totalMarks: number;
}

export interface Exam {
  id: string;
  name: string;
  description: string;
  icon: string;
  sections: TestSection[];
}

export interface TestResult {
  id: string;
  studentId: string;
  studentName: string;
  collegeId: string;
  examId: string;
  sectionId: string;
  examName: string;
  sectionName: string;
  score: number;
  totalMarks: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  totalQuestions: number;
  rank: number;
  date: string;
  timeTaken: number;
}

export const mockUsers: User[] = [
  { id: "admin-1", username: "admin@123", password: "admin@123", role: "admin", name: "Super Admin" },
  { id: "college-1", username: "srm_college", password: "srm@123", role: "college", name: "SRM University", collegeId: "col-1" },
  { id: "college-2", username: "vit_college", password: "vit@123", role: "college", name: "VIT University", collegeId: "col-2" },
  { id: "student-1", username: "rahul_s", password: "rahul@123", role: "student", name: "Rahul Sharma", collegeId: "col-1" },
  { id: "student-2", username: "priya_k", password: "priya@123", role: "student", name: "Priya Kumar", collegeId: "col-1" },
  { id: "student-3", username: "amit_v", password: "amit@123", role: "student", name: "Amit Verma", collegeId: "col-2" },
  { id: "student-4", username: "sneha_r", password: "sneha@123", role: "student", name: "Sneha Reddy", collegeId: "col-2" },
];

export const mockColleges: College[] = [
  { id: "col-1", name: "SRM University", code: "SRM", username: "srm_college", password: "srm@123", studentCount: 2 },
  { id: "col-2", name: "VIT University", code: "VIT", username: "vit_college", password: "vit@123", studentCount: 2 },
];

export const mockStudents: Student[] = [
  { id: "student-1", name: "Rahul Sharma", username: "rahul_s", password: "rahul@123", collegeId: "col-1", collegeName: "SRM University", email: "rahul@srm.edu" },
  { id: "student-2", name: "Priya Kumar", username: "priya_k", password: "priya@123", collegeId: "col-1", collegeName: "SRM University", email: "priya@srm.edu" },
  { id: "student-3", name: "Amit Verma", username: "amit_v", password: "amit@123", collegeId: "col-2", collegeName: "VIT University", email: "amit@vit.edu" },
  { id: "student-4", name: "Sneha Reddy", username: "sneha_r", password: "sneha@123", collegeId: "col-2", collegeName: "VIT University", email: "sneha@vit.edu" },
];

const jeeQuestions: Question[] = [
  { id: "q1", text: "A particle moves in a straight line with uniform acceleration. Its velocity at time t=0 is v₁ and at time t=T is v₂. The average velocity in this interval is:", type: "MCQ", options: ["(v₁ + v₂)/2", "(v₁ - v₂)/2", "v₂ - v₁", "v₁v₂"], correctAnswer: "(v₁ + v₂)/2", marks: 4, negativeMarks: 1 },
  { id: "q2", text: "The SI unit of electric field intensity is:", type: "MCQ", options: ["N/C", "J/C", "V/m²", "Both A and C"], correctAnswer: "N/C", marks: 4, negativeMarks: 1 },
  { id: "q3", text: "Which of the following are scalar quantities?", type: "MSQ", options: ["Speed", "Velocity", "Energy", "Force"], correctAnswer: ["Speed", "Energy"], marks: 4, negativeMarks: 1 },
  { id: "q4", text: "If log₂(x) = 5, find the value of x.", type: "NAT", correctAnswer: 32, marks: 4, negativeMarks: 0 },
  { id: "q5", text: "The derivative of sin²(x) with respect to x is:", type: "MCQ", options: ["2sin(x)", "sin(2x)", "cos²(x)", "2cos(x)"], correctAnswer: "sin(2x)", marks: 4, negativeMarks: 1 },
  { id: "q6", text: "What is the pH of a 0.001 M HCl solution?", type: "NAT", correctAnswer: 3, marks: 4, negativeMarks: 0 },
  { id: "q7", text: "Which of the following elements have highest electronegativity?", type: "MCQ", options: ["Fluorine", "Oxygen", "Nitrogen", "Chlorine"], correctAnswer: "Fluorine", marks: 4, negativeMarks: 1 },
  { id: "q8", text: "The work done in moving a charge of 2C across two points having potential difference of 12V is:", type: "MCQ", options: ["24 J", "6 J", "14 J", "10 J"], correctAnswer: "24 J", marks: 4, negativeMarks: 1 },
  { id: "q9", text: "Select the correct statements about electromagnetic waves:", type: "MSQ", options: ["They carry energy", "They need a medium", "They travel at speed of light in vacuum", "They are transverse waves"], correctAnswer: ["They carry energy", "They travel at speed of light in vacuum", "They are transverse waves"], marks: 4, negativeMarks: 1 },
  { id: "q10", text: "The value of integral ∫₀¹ x² dx is:", type: "NAT", correctAnswer: 0.333, marks: 4, negativeMarks: 0 },
];

const eamcetQuestions: Question[] = [
  { id: "eq1", text: "The acceleration due to gravity on the surface of the moon is approximately:", type: "MCQ", options: ["1.6 m/s²", "3.2 m/s²", "9.8 m/s²", "6.4 m/s²"], correctAnswer: "1.6 m/s²", marks: 1, negativeMarks: 0 },
  { id: "eq2", text: "Which vitamin is also known as ascorbic acid?", type: "MCQ", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], correctAnswer: "Vitamin C", marks: 1, negativeMarks: 0 },
  { id: "eq3", text: "The number of chromosomes in a human cell is:", type: "NAT", correctAnswer: 46, marks: 1, negativeMarks: 0 },
  { id: "eq4", text: "Which of the following are Noble gases?", type: "MSQ", options: ["Helium", "Nitrogen", "Argon", "Neon"], correctAnswer: ["Helium", "Argon", "Neon"], marks: 1, negativeMarks: 0 },
  { id: "eq5", text: "The chemical formula of glucose is:", type: "MCQ", options: ["C₆H₁₂O₆", "C₆H₆", "C₂H₅OH", "CH₃COOH"], correctAnswer: "C₆H₁₂O₆", marks: 1, negativeMarks: 0 },
];

export const mockExams: Exam[] = [
  {
    id: "exam-1",
    name: "JEE Main",
    description: "Joint Entrance Examination for Engineering",
    icon: "🏗️",
    sections: [
      { id: "sec-1", name: "Grand Test 1", examId: "exam-1", duration: 180, questions: jeeQuestions, totalMarks: 40 },
      { id: "sec-2", name: "Mock Test 1", examId: "exam-1", duration: 60, questions: jeeQuestions.slice(0, 5), totalMarks: 20 },
      { id: "sec-3", name: "Practice Test 1", examId: "exam-1", duration: 30, questions: jeeQuestions.slice(0, 3), totalMarks: 12 },
    ],
  },
  {
    id: "exam-2",
    name: "EAMCET",
    description: "Engineering, Agriculture & Medical Common Entrance Test",
    icon: "🔬",
    sections: [
      { id: "sec-4", name: "Grand Test 1", examId: "exam-2", duration: 120, questions: eamcetQuestions, totalMarks: 5 },
      { id: "sec-5", name: "Final Test 1", examId: "exam-2", duration: 90, questions: eamcetQuestions.slice(0, 3), totalMarks: 3 },
    ],
  },
];

export const mockResults: TestResult[] = [
  { id: "r1", studentId: "student-1", studentName: "Rahul Sharma", collegeId: "col-1", examId: "exam-1", sectionId: "sec-1", examName: "JEE Main", sectionName: "Grand Test 1", score: 32, totalMarks: 40, correct: 8, incorrect: 1, unanswered: 1, totalQuestions: 10, rank: 1, date: "2026-03-01", timeTaken: 165 },
  { id: "r2", studentId: "student-2", studentName: "Priya Kumar", collegeId: "col-1", examId: "exam-1", sectionId: "sec-1", examName: "JEE Main", sectionName: "Grand Test 1", score: 28, totalMarks: 40, correct: 7, incorrect: 2, unanswered: 1, totalQuestions: 10, rank: 2, date: "2026-03-01", timeTaken: 170 },
  { id: "r3", studentId: "student-3", studentName: "Amit Verma", collegeId: "col-2", examId: "exam-1", sectionId: "sec-1", examName: "JEE Main", sectionName: "Grand Test 1", score: 24, totalMarks: 40, correct: 6, incorrect: 3, unanswered: 1, totalQuestions: 10, rank: 3, date: "2026-03-01", timeTaken: 175 },
  { id: "r4", studentId: "student-4", studentName: "Sneha Reddy", collegeId: "col-2", examId: "exam-2", sectionId: "sec-4", examName: "EAMCET", sectionName: "Grand Test 1", score: 4, totalMarks: 5, correct: 4, incorrect: 1, unanswered: 0, totalQuestions: 5, rank: 1, date: "2026-03-02", timeTaken: 80 },
  { id: "r5", studentId: "student-1", studentName: "Rahul Sharma", collegeId: "col-1", examId: "exam-2", sectionId: "sec-4", examName: "EAMCET", sectionName: "Grand Test 1", score: 3, totalMarks: 5, correct: 3, incorrect: 1, unanswered: 1, totalQuestions: 5, rank: 2, date: "2026-03-02", timeTaken: 90 },
];
