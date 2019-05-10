/* tslint:disable:max-classes-per-file */
/**
 * @module grobber
 */

/* @ignore */

import runtime = chrome.runtime;
import {marshalError, unmarshalError} from "dolos/utils";
import {GrobberCheckReport, GrobberClientLike, GrobberSearchOptions} from "./client";
import {AnimeInfo, Episode, GrobberInfo, GrobberMedium, GrobberSearchResult} from "./models";

interface Message {
    id: string;
    procedure: string;
    body: any;
}

interface MessageResponse extends Message {
    /**
     * Marshalled error using [[marshalError]]
     */
    error?: string;
}

function createMessage(procedure: string, body: any): Message {
    const id = `id-${Math.random().toString(36).substr(2, 16)}`;
    return {id, body, procedure};
}

/**
 * Remote version of a [[GrobberClient]].
 * Implements all the API functions [[GrobberClient]] does, but
 * the work is performed by [[RemoteGrobberClientServer]].
 *
 * This client ought to be used by the content scripts in order
 * to create a shared cache.
 */
export class RemoteGrobberClient implements GrobberClientLike {

    private get port(): runtime.Port {
        if (!this._port) this.connect();

        return this._port as runtime.Port;
    }

    private readonly portName: string;
    private readonly waitingPromises: { [id: string]: Array<(resp: any) => void> };

    private _port?: runtime.Port;

    constructor(portName: string = "grobber") {
        this.portName = portName;
        this.waitingPromises = {};
    }

    /** @inheritDoc */
    public async getGrobberInfo(baseURL?: string): Promise<GrobberInfo> {
        return await this.sendMessage("getGrobberInfo", [baseURL]);
    }

    /** @inheritDoc */
    public async checkGrobberInfo(baseURL?: string): Promise<GrobberCheckReport> {
        return await this.sendMessage("checkGrobberInfo", [baseURL]);
    }

    /** @inheritDoc */
    public async getAnimeInfo(uid: string): Promise<AnimeInfo> {
        return await this.sendMessage("getAnimeInfo", [uid]);
    }

    /** @inheritDoc */
    public async getEpisode(uid: string, episodeIndex: number): Promise<Episode> {
        return await this.sendMessage("getEpisode", [uid, episodeIndex]);
    }

    /** @inheritDoc */
    public async searchAnime(query: string, options?: GrobberSearchOptions):
        Promise<Array<GrobberSearchResult<GrobberMedium>> | undefined> {
        return await this.sendMessage("searchAnime", [query, options]);
    }

    /** @inheritDoc */
    public async getAnimeForTitle(title: string, group?: boolean): Promise<GrobberSearchResult<AnimeInfo> | undefined> {
        return await this.sendMessage("getAnimeForTitle", [title, group]);
    }

    private handleDisconnect() {
        delete this._port;
    }

    private handleMessage(message: Message) {
        const waiting = this.waitingPromises[message.id];
        if (waiting) {
            waiting.forEach(waiter => waiter(message));

            this.waitingPromises[message.id] = [];
        }
    }

    private async waitForAnswer(id: string): Promise<MessageResponse> {
        return await new Promise(res => {
            let waiting = this.waitingPromises[id];
            if (!waiting) waiting = this.waitingPromises[id] = [];
            waiting.push(res);
        });
    }

    private connect(): void {
        if (this._port)
            throw new Error("Already connected");

        this._port = runtime.connect("", {name: this.portName});
        this._port.onDisconnect.addListener(this.handleDisconnect.bind(this));
        this._port.onMessage.addListener(this.handleMessage.bind(this));
    }

    private async sendMessage(procedure: string, body: any): Promise<any> {
        const msg = createMessage(procedure, body);
        this.port.postMessage(msg);

        const answer = await this.waitForAnswer(msg.id);
        if (answer.error) throw unmarshalError(answer.error);

        return answer.body;
    }
}

/**
 * "Server" which receives messages from the client and calls the methods
 * on [[GrobberClient]].
 *
 * @see [[RemoteGrobberClient]]
 *
 * **Must call [[RemoteGrobberClientServer.serve]] to start serving!
 */
export class RemoteGrobberClientServer {
    private readonly portName: string;
    private readonly grobberClient: GrobberClientLike;

    /**
     * @param portName - Must be the same as [[RemoteGrobberClient.portName]].
     */
    constructor(client: GrobberClientLike, portName: string = "grobber") {
        this.portName = portName;
        this.grobberClient = client;
    }

    /**
     * Start serving.
     */
    public serve(): void {
        runtime.onConnect.addListener(this.handleConnect.bind(this));
    }

    private handleConnect(port: runtime.Port): void {
        if (port.name !== this.portName) return;

        port.onMessage.addListener(this.handleMessage.bind(this));
    }

    private async performProcedure(procedure: string, body: any): Promise<any> {
        // @ts-ignore
        const func: (...args: any[]) => any | undefined = this.grobberClient[procedure];
        if (!func) throw new Error(`Unknown procedure: ${procedure}`);

        return await func.apply(this.grobberClient, body);
    }

    private async handleMessage(message: Message, port: runtime.Port): Promise<void> {
        const procedure = message.procedure;

        const response: MessageResponse = message;

        try {
            response.body = await this.performProcedure(procedure, message.body);
        } catch (err) {
            response.body = undefined;
            response.error = marshalError(err);
        }

        port.postMessage(response);
    }
}
