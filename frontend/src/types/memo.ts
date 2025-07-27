export interface IMemo {
  id: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  category: 'temporary' | 'memory' | 'archive';
  createdAt: Date;
  updatedAt: Date;
}

export interface IMemoFormData {
  title?: string;
  content: string;
  images: File[];
  category: 'temporary' | 'memory' | 'archive';
} 