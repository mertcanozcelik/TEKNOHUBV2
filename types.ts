
export type TechDomain = string; 
export type IssuePriority = 'Düşük' | 'Orta' | 'Yüksek'; 
export type IssueStatus = 'Pending' | 'Open' | 'In Progress' | 'Completed' | 'Rejected';
export type VadeType = 'Kısa' | 'Orta' | 'Uzun';

export type RoadmapStage = 'Lansman' | 'OneriToplama' | 'NihaiListe';

export interface TechnologicalEvaluation {
  humanResources?: string;    // İnsan Kaynağı
  infrastructure?: string;    // Altyapı
  dualUse?: string;           // Çift Kullanım
  supplyRisk?: string[];      // Temin Riski (Multi-select)
  projectApp?: string;        // Projelere Uygulama
  criticality?: string;       // Kritiklik
  worldStatus?: string;       // Dünyadaki Durum
}

export interface ParticipantForm {
  id: string;
  userId: string;
  roadmapId: string;
  firstName: string;
  lastName: string;
  institution: string;        // Kurum Bilgisi
  expertiseAreas: string;     // Çalışma Alanları
  academicAssets: string;     // Makale - Projeler - Patentler
  capabilities: string;       // Kabiliyet Özetleri
  updatedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface IssueHistory {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface TechIssue {
  id: string;
  title: string;
  description: string;
  domain: TechDomain;
  ocg?: string;
  vade?: VadeType;
  status: IssueStatus;
  priority: IssuePriority;
  dueDate: string;
  suggestedBy: string;
  approved: boolean;
  evaluation?: TechnologicalEvaluation;
  resources: Resource[];
  comments?: IssueComment[];
  history?: IssueHistory[];
  createdAt: string;
}

export interface Roadmap {
  id: string;
  domain?: TechDomain;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  updatedAt: string;
  iconName?: string; 
  colorClass?: string; 
  availableOcgs: string[];
  milestones: any[]; 
  currentStage: RoadmapStage;
}

export type UserRole = 'Admin' | 'User';
export type UserStatus = 'Pending' | 'Approved' | 'Rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; 
  role: UserRole;
  status: UserStatus;
  assignedOtags: TechDomain[];
  assignedOcgs?: string[];
  preferredOtag?: TechDomain;
  preferredOcgs?: string[];
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export interface SavedReport {
  id: string;
  userId: string;
  authorName?: string;
  query: string;
  content: string;
  sources: {title: string, uri: string}[];
  otagTitle?: string;
  isGlobal: boolean;
  isApproved: boolean;
  createdAt: string;
}
