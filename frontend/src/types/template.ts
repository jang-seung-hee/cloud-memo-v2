export interface ITemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITemplateFormData {
  title: string;
  content: string;
  category: string;
}

// 카테고리 관리 관련 타입
export interface ICategory {
  id: string;
  name: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryFormData {
  name: string;
  isActive: boolean;
} 