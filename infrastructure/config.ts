import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config("gcp");

export const project = config.require("project");
export const region = config.get("region") || "us-central1";
export const zone = config.require("zone");
export const clusterName = config.get("gke-cluster") || "dev-cluster";
export const nodeCount = config.getNumber("nodeCount") || 1;
export const nodeSize = config.get("nodeSize") || "e2-standard-4";
export const k8sVersion = config.get("k8sVersion") || "latest";
export const environment = config.get("environment") || "dev";