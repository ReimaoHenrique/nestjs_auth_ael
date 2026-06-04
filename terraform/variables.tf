variable "gcp_project_id" {
  type        = string
  description = "O ID do seu projeto no Google Cloud (GCP)"
}

variable "database_url" {
  type        = string
  description = "A URL do Prisma Accelerate de produção"
  sensitive   = true
}

variable "jwt_secret" {
  type        = string
  description = "A chave secreta do JWT para validação de tokens no NestJS"
  sensitive   = true
}

variable "jwt_refresh" {
  type        = string
  description = "A chave secreta do refresh token JWT para validação no NestJS"
  sensitive   = true
}

variable "image_tag" {
  type        = string
  description = "A tag da imagem Docker"
  default     = "1.0.1"
}
variable "repository_id" {
  type        = string
  description = "O id do repositorio Docker"
  default     = "ael-auth-repo"
}