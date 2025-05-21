import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import {project, environment, nodeCount, nodeSize, zone} from "../config";

export interface ClusterArgs {
    networkId: pulumi.Input<string>;
    subnetId: pulumi.Input<string>;
    clusterName: string;
    environment: string;
}

export class GkeCluster extends pulumi.ComponentResource {
    public readonly cluster: gcp.container.Cluster;
    public readonly nodePool: gcp.container.NodePool;

    constructor(name: string, args: ClusterArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:component:GkeCluster", name, {}, opts);

        const enableGKEApi = new gcp.projects.Service("enableGKEApi", {
            project: project,
            service: "container.googleapis.com",
        }, { parent: this });

        const cluster = new gcp.container.Cluster(name, {
            name: args.clusterName,
            location: zone,
            initialNodeCount: 1,
            removeDefaultNodePool: true,
            network: args.networkId,
            subnetwork: args.subnetId,
            ipAllocationPolicy: {
                clusterSecondaryRangeName: "pods-range",
                servicesSecondaryRangeName: "services-range",
            },
            privateClusterConfig: {
                enablePrivateNodes: true,
                enablePrivateEndpoint: false,
                masterIpv4CidrBlock: "172.16.0.0/28",
            },
            masterAuthorizedNetworksConfig: {
                cidrBlocks: [{ cidrBlock: "0.0.0.0/0", displayName: "All" }],
            },
            workloadIdentityConfig: {
                workloadPool: `${project}.svc.id.goog`,
            },
            releaseChannel: { channel: "REGULAR" },
            deletionProtection: environment === "production",
        }, { dependsOn: [enableGKEApi], parent: this });

        const nodePool = new gcp.container.NodePool("node-pool", {
            name: "node-dev",
            cluster: cluster.name,
            location: zone,
            initialNodeCount: nodeCount,
            nodeConfig: {
                machineType: nodeSize,
                diskSizeGb: 100,
                diskType: "pd-ssd",
                oauthScopes: ["https://www.googleapis.com/auth/cloud-platform"],
                tags: ["gke-node", args.clusterName],
                labels: { environment, "managed-by": "pulumi" },
                shieldedInstanceConfig: {
                    enableSecureBoot: true,
                    enableIntegrityMonitoring: true,
                },
                resourceLabels: {
                    "goog-gke-node-pool-provisioning-model": "on-demand",
                },
                workloadMetadataConfig: {
                    mode: "GKE_METADATA",
                },
            },
            management: {
                autoUpgrade: true,
                autoRepair: true,
            },
            upgradeSettings: {
                maxSurge: 1,
                maxUnavailable: 0,
            },
        }, { parent: this, dependsOn: [cluster] });

        this.cluster = cluster;
        this.nodePool = nodePool;

        this.registerOutputs({
            cluster,
            nodePool,
        });
    }
}

