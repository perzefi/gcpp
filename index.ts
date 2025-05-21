import { Network } from "./infrastructure/network";
import { NginxApp } from "./infrastructure/k8s/app/nginx";
import { deployPulumiOperator } from "./infrastructure/k8s/pulumiOperator";
import { GkeCluster } from "./infrastructure/gke";
import { generateKubeconfig } from "./infrastructure/gke/kubeconfig";
import {clusterName, environment, region} from "./infrastructure/config";
import { Provider } from "@pulumi/kubernetes";

// Create Network
const network = new Network("network", {
    clusterName,
    region,
    environment,
});

// Create GKE Cluster
const gke = new GkeCluster("gke", {
    clusterName,
    environment,
    networkId: network.network.id,
    subnetId: network.subnet.id,
});

const kubeconfig = generateKubeconfig(gke.cluster);

const k8sProvider = new Provider("gke-provider", {
    kubeconfig,
});
new NginxApp("nginx", {
    provider: k8sProvider,
});

export interface gke {
}

// Deploy the operator
deployPulumiOperator({ provider: k8sProvider });