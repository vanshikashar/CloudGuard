# CloudGuard — Intelligent AWS Cost Monitoring & Optimization Platform

CloudGuard is a B.Tech Computer Science major project designed to help developers and organizations monitor AWS spending, identify potentially wasted cloud resources, and optimize infrastructure costs through safe, policy-driven automation.

The platform aims to provide cost visibility, budget monitoring, actionable alerts, and controlled auto-shutdown of explicitly approved development resources. It follows a security-first approach with least-privilege IAM permissions, dry-run execution, approval workflows for risky actions, and audit logging.

## Key Features

- **AWS Cost Monitoring:** Track cloud spending and visualize cost trends.
- **Waste Detection:** Identify potentially idle or underutilized resources.
- **Budget Alerts:** Notify users when spending approaches configured budget thresholds.
- **Safe Auto-Shutdown:** Stop explicitly approved development resources under defined policies.
- **Approval-Based Actions:** Require authorization for risky operations.
- **Dry-Run Mode:** Preview proposed actions before executing them.
- **Security-First Architecture:** Apply least-privilege IAM permissions and security scanning.
- **Audit Logging:** Maintain records of proposed actions, approvals, and execution results.
- **Infrastructure as Code:** Manage infrastructure using Terraform.
- **CI/CD Automation:** Integrate Jenkins for automated testing, security checks, and controlled deployments.

## Technology Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express
- **Cloud Platform:** Amazon Web Services (AWS)
- **AWS Services:** Cost Explorer, AWS Budgets, CloudWatch, Lambda, EventBridge, SNS
- **Infrastructure as Code:** Terraform
- **CI/CD:** Jenkins
- **Security:** IAM least privilege, approval policies, audit logs, security scanning

## Project Goals

- Improve visibility into AWS cloud expenditure.
- Reduce unnecessary development-resource costs.
- Introduce safe and controlled cloud-resource automation.
- Apply DevOps, cloud security, and Infrastructure as Code practices.
- Keep development and testing costs as low as reasonably possible.

## Safety Principles

- Start with local development and dry-run mode.
- Review Terraform plans before creating AWS resources.
- Never automatically delete storage or other persistent data.
- Never automatically modify production resources.
- Require explicit approval for risky actions.
- Review potential AWS charges before provisioning infrastructure.

## Project Status

**Status:** Under Development

CloudGuard is being developed incrementally, beginning with the local application foundation and safety controls before AWS integration and automated infrastructure management.

*Academic Project: B.Tech Computer Science Engineering — Data Science.*
