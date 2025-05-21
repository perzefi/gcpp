import * as k8s from "@pulumi/kubernetes";

export interface OperatorManifestArgs {
    provider: k8s.Provider;
}

export function deployPulumiOperator(args: OperatorManifestArgs): k8s.yaml.ConfigFile {
    const { provider } = args;

    const operatorManifest = new k8s.yaml.ConfigFile("pulumi-operator", {
        file: "https://raw.githubusercontent.com/pulumi/pulumi-kubernetes-operator/refs/tags/v2.0.0/deploy/quickstart/install.yaml",
    } , { provider });

    return operatorManifest;
}
