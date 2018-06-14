# Kubernetes public IP Changer

This application iterates via all servies with specific label, and recycles their Service.

This will aquire a new public IP.

This functionality is needed for some applications which don't want to be associated with a single public IP.

## Instructions
1. Deploy to your cluster using the provided `deployment.yaml` file. Edit the CronJob section to meet your interval needs.
2. Label services you want to recycle with the following label: 
```json
{ "recycle": "yes" }
```