import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import {clusterName, environment} from "../config";

export interface NetworkArgs {
    clusterName: string;
    region: string;
    environment: string;

}

export class Network extends pulumi.ComponentResource {
    public readonly network: gcp.compute.Network;
    public readonly subnet: gcp.compute.Subnetwork;
    public readonly router: gcp.compute.Router;
    public readonly nat: gcp.compute.RouterNat;

    constructor(name: string, args: NetworkArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:component:Network", name, {}, opts);

        const environment = `${args.clusterName}`;

        const network = new gcp.compute.Network(`${environment}-network`, {
            name: `${environment}-network`,
            autoCreateSubnetworks: false,
            description: `Network for the ${clusterName} `
        }, { parent: this });

        const subnet = new gcp.compute.Subnetwork(`${environment}-subnet`, {
            name: `${environment}-subnet`,
            ipCidrRange: "10.0.0.0/20",
            region: args.region,
            network: network.id,
            privateIpGoogleAccess: true,
            secondaryIpRanges: [
                { rangeName: "services-range", ipCidrRange: "10.1.0.0/20" },
                { rangeName: "pods-range", ipCidrRange: "10.2.0.0/16" },
            ],
        }, { parent: this });

        const router = new gcp.compute.Router(`${environment}-router`, {
            name: `${environment}-router`,
            region: args.region,
            network: network.id,
        }, { parent: this });

        const nat = new gcp.compute.RouterNat(`${environment}-nat`, {
            name: `${environment}-nat`,
            router: router.name,
            region: args.region,
            natIpAllocateOption: "AUTO_ONLY",
            sourceSubnetworkIpRangesToNat: "ALL_SUBNETWORKS_ALL_IP_RANGES",
            logConfig: { enable: true, filter: "ERRORS_ONLY" },
        }, { parent: this });

        this.network = network;
        this.subnet = subnet;
        this.router = router;
        this.nat = nat;

        this.registerOutputs({
            network,
            subnet,
            router,
            nat,
        });
    }
}
