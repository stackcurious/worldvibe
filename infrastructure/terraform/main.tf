terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_eks_cluster" "worldvibe" {
  name     = "worldvibe-eks"
  version  = "1.27"
  role_arn = var.eks_role_arn

  vpc_config {
    subnet_ids = var.subnet_ids
  }
}

# Additional resources for RDS (Timescale) or Aurora PG, Redis, etc.

output "eks_endpoint" {
  value = aws_eks_cluster.worldvibe.endpoint
}
