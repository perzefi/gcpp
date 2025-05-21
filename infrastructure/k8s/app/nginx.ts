import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface NginxAppArgs {
    provider: k8s.Provider;
}

export class NginxApp extends pulumi.ComponentResource {
    constructor(name: string, args: NginxAppArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:app:NginxApp", name, {}, opts);

        const labels = { app: "nginx" };

        const deployment = new k8s.apps.v1.Deployment(`${name}-deployment`, {
            metadata: { name: `${name}-deployment` },
            spec: {
                replicas: 2,
                selector: { matchLabels: labels },
                template: {
                    metadata: { labels },
                    spec: {
                        containers: [{
                            name: "nginx",
                            image: "nginx:1.25",
                            ports: [{ containerPort: 80 }],
                        }],
                    },
                },
            },
        }, { provider: args.provider, parent: this });

        const service = new k8s.core.v1.Service(`${name}-service`, {
            metadata: { name: `${name}-service` },
            spec: {
                type: "LoadBalancer",
                selector: labels,
                ports: [{
                    port: 80,
                    targetPort: 80,
                }],
            },
        }, { provider: args.provider, parent: this });

        this.registerOutputs();
    }
}
