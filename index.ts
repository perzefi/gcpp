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

// Define a custom provider if needed

// Deploy the operator
deployPulumiOperator({ provider: k8sProvider });

// import * as pulumi from "@pulumi/pulumi";
// import * as gcp from "@pulumi/gcp";
// import * as k8s from "@pulumi/kubernetes";
//
// // Get configuration values from Pulumi stack or use defaults
// const config = new pulumi.Config("gcp");
// const project = config.require("project");
// const region = config.get("region") || "us-central1";
// const clusterName = config.get("clusterName") || "dev-cluster";
// const nodeCount = config.getNumber("nodeCount") || 1;
// const nodeSize = config.get("nodeSize") || "e2-standard-4";
// const k8sVersion = config.get("k8sVersion") || "latest";
// const environment = config.get("environment") || "dev";
// const zone = config.require("zone");
// // Network configuration
// const network = new gcp.compute.Network(`${clusterName}-network`, {
//     name: `${clusterName}-network`,
//     autoCreateSubnetworks: false,
//     description: `Network for the ${clusterName} GKE cluster`,
//     deleteDefaultRoutesOnCreate: false,
// });
//
// const enableGKEApi = new gcp.projects.Service("enableGKEApi", {
//     project: project,
//     service: "container.googleapis.com",
//     disableOnDestroy: false, // prevents accidental disabling
// });
//
// // Create subnets
// const subnet = new gcp.compute.Subnetwork(`${clusterName}-subnet`, {
//     name: `${clusterName}-subnet`,
//     ipCidrRange: "10.0.0.0/20", // Customize this based on your IP requirements
//     region: region,
//     network: network.id,
//     privateIpGoogleAccess: true,
//     secondaryIpRanges: [
//         {
//             rangeName: "services-range",
//             ipCidrRange: "10.1.0.0/20",
//         },
//         {
//             rangeName: "pods-range",
//             ipCidrRange: "10.2.0.0/16",
//         },
//     ],
// }, { dependsOn: [network] });
//
// // Router for internet access from private nodes
// const router = new gcp.compute.Router(`${clusterName}-router`, {
//     name: `${clusterName}-router`,
//     region: region,
//     network: network.id,
// }, { dependsOn: [network] });
//
// // NAT config for egress from private nodes
// const nat = new gcp.compute.RouterNat(`${clusterName}-nat`, {
//     name: `${clusterName}-nat`,
//     router: router.name,
//     region: region,
//     natIpAllocateOption: "AUTO_ONLY",
//     sourceSubnetworkIpRangesToNat: "ALL_SUBNETWORKS_ALL_IP_RANGES",
//     logConfig: {
//         enable: true,
//         filter: "ERRORS_ONLY",
//     },
// }, { dependsOn: [router] });
//
// // Firewall for internal cluster communication
// const firewallInternal = new gcp.compute.Firewall(`${clusterName}-internal-firewall`, {
//     name: `${clusterName}-internal-firewall`,
//     network: network.id,
//     allows: [
//         {
//             protocol: "tcp",
//         },
//         {
//             protocol: "udp",
//         },
//         {
//             protocol: "icmp",
//         },
//     ],
//     sourceRanges: [
//         "10.0.0.0/20",
//         "10.1.0.0/20",
//         "10.2.0.0/16",
//     ],
// }, { dependsOn: [network] });
//
// // Allow SSH for debugging (restrict further in dev)
// const firewallSsh = new gcp.compute.Firewall(`${clusterName}-ssh-firewall`, {
//     name: `${clusterName}-ssh-firewall`,
//     network: network.id,
//     allows: [
//         {
//             protocol: "tcp",
//             ports: ["22"],
//         },
//     ],
//     // In production, restrict to your bastion host or VPN IP ranges
//     sourceRanges: ["0.0.0.0/0"], // GCP IAP forwardable IP range
//     targetTags: ["gke-node"],
// }, { dependsOn: [network] });
//
// // Create a GKE cluster
// const cluster = new gcp.container.Cluster(clusterName, {
//     name: clusterName,
//     location: zone,
//     // Regional cluster for high availability
//     initialNodeCount: 1,  // Initial node count per zone
//     removeDefaultNodePool: true,  // Remove default node pool and create custom ones
//     network: network.id,
//     subnetwork: subnet.id,
//     ipAllocationPolicy: {
//         clusterSecondaryRangeName: "pods-range",
//         servicesSecondaryRangeName: "services-range",
//     },
//     // Private cluster configuration
//     privateClusterConfig: {
//         enablePrivateNodes: true,
//         enablePrivateEndpoint: false,
//         masterIpv4CidrBlock: "172.16.0.0/28",
//     },
//     masterAuthorizedNetworksConfig: {
//         cidrBlocks: [
//             // Add your admin/management IPs here
//             { cidrBlock: "0.0.0.0/0", displayName: "All (restrict this in production)" },
//         ],
//     },
//     // Release channel for automatic upgrades
//     releaseChannel: {
//         channel: "REGULAR",
//     },
//     // Enable workload identity for better security
//     workloadIdentityConfig: {
//         workloadPool: `${project}.svc.id.goog`,
//     },
//
//     // Binary Authorization for image validation
//     binaryAuthorization: {
//         evaluationMode: "PROJECT_SINGLETON_POLICY_ENFORCE",
//     },
//     datapathProvider: "ADVANCED_DATAPATH",  // Enable dataplane v2
//     // Set up logging and monitoring
//     loggingService: "logging.googleapis.com/kubernetes",
//     monitoringService: "monitoring.googleapis.com/kubernetes",
//     // Enable GKE's config management for GitOps
//     addonsConfig: {
//         configConnectorConfig: {
//             enabled: true,
//         },
//         dnsCacheConfig: {
//             enabled: true,
//         },
//         gcpFilestoreCsiDriverConfig: {
//             enabled: true,
//         },
//         horizontalPodAutoscaling: {
//             disabled: false,
//         },
//         httpLoadBalancing: {
//             disabled: false,
//         },
//         networkPolicyConfig: {
//             disabled: true,
//         },
//     },
//     // Enable VPA (Vertical Pod Autoscaler)
//     verticalPodAutoscaling: {
//         enabled: true,
//     },
//     // Set deletion_protection to false to allow easier management in dev environments
//     // For production, consider setting this to true
//     deletionProtection: environment === "production",
// }, { dependsOn: [enableGKEApi, subnet, nat] });
//
// // Create a single production-grade node pool for all workloads
// const nodePool = new gcp.container.NodePool("primary-node-pool", {
//     name: "primary-node-pool",
//     cluster: cluster.name,
//     location: zone,
//     initialNodeCount: nodeCount, // Per zone in regional cluster
//
//
//     // Configure node settings for production
//     nodeConfig: {
//         preemptible: false, // Use regular nodes for production stability
//         machineType: nodeSize, // From config
//         diskSizeGb: 100,
//         diskType: "pd-ssd", // SSD for better performance
//
//         // Full cloud platform access
//         oauthScopes: [
//             "https://www.googleapis.com/auth/cloud-platform",
//         ],
//
//         // General purpose labels
//         labels: {
//             "environment": environment,
//             "managed-by": "pulumi",
//         },
//
//         // Network tags for firewall rules
//         tags: ["gke-node", clusterName],
//
//         // Security configurations
//         shieldedInstanceConfig: {
//             enableIntegrityMonitoring: true,
//             enableSecureBoot: true,
//         },
//
//         // Workload identity for accessing GCP services
//         workloadMetadataConfig: {
//             mode: "GKE_METADATA",
//         },
//
//         // Optional: local SSD for high-performance workloads
//         // Uncomment if needed
//         // localSsdCount: 1,
//
//         // Optional: GPU configuration
//         // Uncomment and adjust if needed
//         // accelerators: [{
//         //     count: 1,
//         //     type: "nvidia-tesla-t4",
//         // }],
//     },
//
//     // Management settings for node lifecycle
//     management: {
//         autoRepair: true,
//         autoUpgrade: true,
//     },
//
//     // Control surge upgrades for production stability
//     upgradeSettings: {
//         maxSurge: 1,        // Maximum number of additional nodes during upgrade
//         maxUnavailable: 0,  // No nodes should be unavailable during upgrades
//     },
//
//     // Optional: node locations for specific zone selection
//     // Uncomment and adjust if you need specific zones
//     // nodeLocations: [
//     //    `${region}-a`,
//     //    `${region}-b`,
//     //    `${region}-c`,
//     // ],
// }, { dependsOn: [cluster] });
//
// // Export cluster info
// export const clusterSelfLink = cluster.selfLink;
// export const clusterEndpoint = cluster.endpoint;
// export const clusterMasterVersion = cluster.masterVersion;
// export const networkName = network.name;
// export const subnetName = subnet.name;
// export const nodePoolName = nodePool.name;
// // export const kubeconfig = pulumi.all([cluster.name, cluster.endpoint, cluster.masterAuth]).apply(
// //     ([name, endpoint, masterAuth]) => {
// //         const context = `${gcp.config.project}_${gcp.config.zone}_${name}`;
// //         return `apiVersion: v1
// // clusters:
// // - cluster:
// //     certificate-authority-data: ${masterAuth.clusterCaCertificate}
// //     server: https://${endpoint}
// //   name: ${context}
// // contexts:
// // - context:
// //     cluster: ${context}
// //     user: ${context}
// //   name: ${context}
// // current-context: ${context}
// // kind: Config
// // preferences: {}
// // users:
// // - name: ${context}
// //   user:
// //     user:
// //     exec:
// //       apiVersion: client.authentication.k8s.io/v1beta1
// //       command: gke-gcloud-auth-plugin
// //       provideClusterInfo: true
// // `;
// //     });
// //
// // const k8sProvider = new k8s.Provider("gke-k8s-provider", {
// //     kubeconfig: kubeconfig,
// // });
//
// // const appLabels = { app: "nginx" };
// //
// // const deployment = new k8s.apps.v1.Deployment("nginx-deployment", {
// //     metadata: { labels: appLabels },
// //     spec: {
// //         replicas: 2,
// //         selector: { matchLabels: appLabels },
// //         template: {
// //             metadata: { labels: appLabels },
// //             spec: {
// //                 containers: [{
// //                     name: "nginx",
// //                     image: "nginx:1.25",
// //                     ports: [{ containerPort: 80 }],
// //                 }],
// //             },
// //         },
// //     },
// // }, { provider: k8sProvider });
// //
// // const service = new k8s.core.v1.Service("nginx-service", {
// //     metadata: { labels: appLabels },
// //     spec: {
// //         type: "LoadBalancer",
// //         ports: [{ port: 80, targetPort: 80 }],
// //         selector: appLabels,
// //     },
// // }, { provider: k8sProvider });