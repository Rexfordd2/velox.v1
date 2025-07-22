export interface UserDocument {
  id: string;
  file_path: string;
  created_at: string;
}

const mockDocuments: UserDocument[] = [
  {
    id: 'doc-1',
    file_path: 'training/workout-plan-2024.pdf',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'doc-2',
    file_path: 'progress/progress-report-jan.pdf',
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

export default async function getUserDocuments(): Promise<UserDocument[]> {
  // Return mock documents for development
  return mockDocuments;
} 