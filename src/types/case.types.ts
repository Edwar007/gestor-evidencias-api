export interface CreateCaseDTO {
  titulo: string;
  descripcion: string;
}

export interface UpdateCaseDTO {
  titulo?: string;
  descripcion?: string;
  estado?: "OPEN" | "CLOSED";
}