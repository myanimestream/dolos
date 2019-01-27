declare module "keen-tracking" {
    export default class KeenTracking {
        constructor(options: { projectId: string; writeKey: string; requestType?: string });

        recordEvent(
            collectionName: string,
            event: object
        ): Promise<{ created: boolean }>;

        recordEvents(events: {
            [collectionName: string]: object[];
        }): Promise<{
            [collectionName: string]: boolean[];
        }>;

        initAutoTracking(): KeenTracking;
    }
}