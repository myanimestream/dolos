declare module "keen-tracking" {
    export default class KeenTracking {
        constructor(options: { projectId: string; writeKey: string; requestType?: string });

        public extendEvents(data: any): void;

        public recordEvent(
            collectionName: string,
            event: object,
        ): Promise<{ created: boolean }>;

        public recordEvents(events: {
            [collectionName: string]: object[];
        }): Promise<{
            [collectionName: string]: boolean[];
        }>;

        public initAutoTracking(options?: any): KeenTracking;
    }
}
