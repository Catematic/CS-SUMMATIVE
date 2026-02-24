
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { OnboardingData, AnalysisResult, UniversityRoadmap } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeCounselingData = async (data: OnboardingData): Promise<AnalysisResult> => {
  const prompt = `Act as an elite University & Career Counselor. Analyze this student profile:
  
  Student Data:
  - Interests: ${data.interests}
  - Dislikes: ${data.dislikes}
  - Core Skills: ${data.skills}
  - Region Pref: ${data.location}
  - Budget Limit: ${data.budget}
  - Future Vision: ${data.goals}
  - Curriculum Pref: ${data.curriculum}

  Output Requirements:
  1. Exactly 3 recommended majors. For each, include salary, companies that hire most, degree requirements, and growth outlook.
  2. Exactly 5 universities. For each, maximize data density: include rankings, tuition, graduate salary, language, website, acceptance rate, faculty ratio, enrollment count, aid policy, and campus setting.
  3. For EACH university, explicitly list which of the 3 recommended majors from Step 1 are offered and exceptionally strong at that institution in the "offeredMajors" field.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchSummary: { type: Type.STRING },
          majors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                whyFits: { type: Type.STRING },
                avgSalary: { type: Type.STRING },
                commonJobs: { type: Type.ARRAY, items: { type: Type.STRING } },
                careerPathDetails: { type: Type.STRING },
                topCompanies: { type: Type.ARRAY, items: { type: Type.STRING } },
                degreeLevel: { type: Type.STRING },
                jobGrowth: { type: Type.STRING },
              },
              required: ["name", "whyFits", "avgSalary", "commonJobs", "careerPathDetails", "topCompanies", "degreeLevel", "jobGrowth"],
            },
          },
          universities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                location: { type: Type.STRING },
                description: { type: Type.STRING },
                annualTuition: { type: Type.STRING },
                avgGraduateSalary: { type: Type.STRING },
                nationalRanking: { type: Type.STRING },
                internationalRanking: { type: Type.STRING },
                curriculumFocus: { type: Type.STRING },
                language: { type: Type.STRING },
                website: { type: Type.STRING },
                acceptanceRate: { type: Type.STRING },
                facultyRatio: { type: Type.STRING },
                totalEnrollment: { type: Type.STRING },
                financialAidStatus: { type: Type.STRING },
                campusSetting: { type: Type.STRING },
                offeredMajors: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["name", "type", "location", "description", "annualTuition", "avgGraduateSalary", "nationalRanking", "internationalRanking", "curriculumFocus", "language", "website", "acceptanceRate", "facultyRatio", "totalEnrollment", "financialAidStatus", "campusSetting", "offeredMajors"],
            },
          },
        },
        required: ["matchSummary", "majors", "universities"],
      },
    },
  });

  try {
    return JSON.parse(response.text) as AnalysisResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("The counselor encountered an issue processing your profile.");
  }
};

export const generateUniversityRoadmap = async (student: OnboardingData, universityName: string): Promise<UniversityRoadmap> => {
  const prompt = `Act as an elite University Admissions Consultant. Create a detailed, tailored admissions roadmap for a student targeting ${universityName}.
  
  Student Context:
  - Curriculum: ${student.curriculum}
  - Interests: ${student.interests}
  - Future Goals: ${student.goals}
  
  The roadmap must cover High School (Grade 9 through Grade 12) all the way to Admission.
  Focus on specific standardized tests, extracurriculars that align with ${universityName}'s values, essay strategies, and portfolio requirements.
  Be specific to the university's location and known academic rigor.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          universityName: { type: Type.STRING },
          overview: { type: Type.STRING },
          phases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                timeline: { type: Type.STRING },
                description: { type: Type.STRING },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                importance: { type: Type.STRING, enum: ["Critical", "Recommended", "Optional"] },
              },
              required: ["title", "timeline", "description", "tasks", "importance"],
            },
          },
        },
        required: ["universityName", "overview", "phases"],
      },
    },
  });

  try {
    return JSON.parse(response.text) as UniversityRoadmap;
  } catch (error) {
    console.error("Failed to parse Roadmap response:", error);
    throw new Error("The counselor could not finalize the roadmap at this time.");
  }
};

export const startCounselorChat = (initialContext: OnboardingData, analysis: AnalysisResult): Chat => {
  const context = `You are an expert University & Career Counselor. 
  Student Profile: ${JSON.stringify(initialContext)}
  Recommendations: ${JSON.stringify(analysis)}
  
  CORE GUIDELINES:
  1. Be extremely straightforward and direct. 
  2. Answer only what is asked. 
  3. DO NOT offer unsolicited suggestions or advice unless specifically prompted "What do you think?" or similar.
  4. Use standard Markdown for formatting (bold, lists).
  5. If the user asks for information about a specific university, you MUST provide a JSON block wrapped in \`\`\`university-card ... \`\`\` containing the fields: name, type, location, description, annualTuition, avgGraduateSalary, nationalRanking, internationalRanking, curriculumFocus, language, website, acceptanceRate, facultyRatio, totalEnrollment, financialAidStatus, campusSetting.`;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: context,
    },
  });
};
