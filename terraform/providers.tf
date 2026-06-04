terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0" # Usa a versão atualizada do provider do Google
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = "southamerica-east1"
}