/**
 * Entidade de domínio para Editorias / Categorias do Portal.
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  displayOrder: number;
  showInMenu: boolean;
  createdAt: string;
  updatedAt: string;
  articleCount?: number;
}

export interface CreateCategoryDTO {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  displayOrder?: number;
  showInMenu?: boolean;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {
  id: string;
}

