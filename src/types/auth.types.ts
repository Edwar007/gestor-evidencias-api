export interface CreateUserDTO {
  email: string;
  password: string;
}

export interface UserDTO {
  id: string;
  email: string;
  createdAt: Date;
}