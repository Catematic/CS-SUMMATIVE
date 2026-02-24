
export interface OnboardingData {
  interests: string;
  dislikes: string;
  skills: string;
  location: string;
  budget: string;
  goals: string;
  curriculum: string;
}

export interface RecommendedMajor {
  name: string;
  whyFits: string;
  avgSalary: string;
  commonJobs: string[];
  careerPathDetails: string;
  topCompanies: string[]; // Companies that hire for this role
  degreeLevel: string;    // Required degree (e.g. Masters, Bachelors)
  jobGrowth: string;      // Expected growth rate
}

export interface RecommendedUniversity {
  name: string;
  type: 'Reach' | 'Match' | 'Safety';
  location: string;
  description: string;
  annualTuition: string;
  avgGraduateSalary: string;
  nationalRanking: string;
  internationalRanking: string;
  curriculumFocus: string;
  language: string;
  website: string;
  acceptanceRate: string;      // e.g. "8%"
  facultyRatio: string;        // e.g. "1:7"
  totalEnrollment: string;     // e.g. "32,000"
  financialAidStatus: string;  // e.g. "Need-blind for domestic"
  campusSetting: string;       // e.g. "Urban", "Suburban"
  offeredMajors: string[];     // List of the recommended majors that this specific university offers/excels in
}

export interface RoadmapStep {
  title: string;
  timeline: string; // e.g. "Grade 9", "Summer before Grade 12"
  description: string;
  tasks: string[];
  importance: 'Critical' | 'Recommended' | 'Optional';
}

export interface UniversityRoadmap {
  universityName: string;
  overview: string;
  phases: RoadmapStep[];
}

export interface AnalysisResult {
  matchSummary: string;
  majors: RecommendedMajor[];
  universities: RecommendedUniversity[];
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
