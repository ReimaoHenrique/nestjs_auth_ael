# 1. Cria o repositório Docker no Artifact Registry em SP
resource "google_artifact_registry_repository" "ael_auth_repo" {
  location      = "southamerica-east1"
  repository_id = "ael-auth-repo"
  description   = "Repositorio Docker para o Monorepo Perfil AEL"
  format        = "DOCKER"
}

# 2. Cria e configura o Serviço do Cloud Run v2
resource "google_cloud_run_v2_service" "api_service" {
  name                = "ael-auth-repo"
  location            = "southamerica-east1"
  deletion_protection = false # <--- ADICIONE ESTA LINHA AQUI!

  template {
    # Faz a API escalar de 0 a 10 instâncias (economiza dinheiro quando ninguém usa)
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    containers {
      # Aponta dinamicamente para o repositório criado acima e a imagem enviada
      image = "southamerica-east1-docker.pkg.dev/lucky-era-497723-q0/ael-auth-repo/ael_aufth:2.0.3"

      ports {
        container_port = 8080 # Batendo exatamente com o EXPOSE do seu Dockerfile
      }

      # Injeta as variáveis de ambiente necessárias para o NestJS iniciar
      env {
        name  = "DATABASE_URL"
        value = var.database_url
      }

      env {
        name  = "JWT_SECRET"
        value = var.jwt_secret
      }

      env {
        name  = "JWT_REFRESH_SECRET"
        value = var.jwt_refresh
      }

      # Alocação de recursos apropriada para rodar a API de 790MB lisa
      resources {
        limits = {
          cpu    = "1"
          memory = "1024Mi" # 1GB de RAM
        }
      }
    }
  }
}

# 3. Permite acesso público externo para a API receber requisições da internet
resource "google_cloud_run_v2_service_iam_binding" "public_access" {
  location = google_cloud_run_v2_service.api_service.location
  name     = google_cloud_run_v2_service.api_service.name
  role     = "roles/run.invoker"
  members  = [
    "allUsers"
  ]
}

# 4. Printa a URL pública da API no final do 'terraform apply'
output "api_url" {
  value       = google_cloud_run_v2_service.api_service.uri
  description = "A URL pública gerada pelo Google Cloud Run para a sua API NestJS"
}