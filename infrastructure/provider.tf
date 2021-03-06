provider "aws" {
  region = var.region
}

data "aws_region" "current" {}

data "http" "git_sha" {
  url = "https://api.github.com/repos/dymajo/waka-importer/branches/master"
}

data "digitalocean_kubernetes_cluster" "sfo2" {
  name = "sfo2-prod"
}

provider "kubernetes" {
  host  = data.digitalocean_kubernetes_cluster.sfo2.endpoint
  token = data.digitalocean_kubernetes_cluster.sfo2.kube_config[0].token
  cluster_ca_certificate = base64decode(
    data.digitalocean_kubernetes_cluster.sfo2.kube_config[0].cluster_ca_certificate
  )
}
