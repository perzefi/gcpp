import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

export function generateKubeconfig(cluster: gcp.container.Cluster): pulumi.Output<string> {
    return pulumi.all([cluster.name, cluster.endpoint, cluster.masterAuth]).apply(([name, endpoint, auth]) => {
        const context = `${gcp.config.project}_${gcp.config.zone}_${name}`;
        return `
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${auth.clusterCaCertificate}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: gke-gcloud-auth-plugin
      installHint: Install gke-gcloud-auth-plugin from https://cloud.google.com/blog/products/containers-kubernetes/kubectl-auth-changes-in-gke
      provideClusterInfo: true
      interactiveMode: IfAvailable
`;
    });
}