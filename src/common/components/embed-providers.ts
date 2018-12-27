export interface EmbedProvider {
    name?: string,
    icon?: string
}

const embedProvider: { [host: string]: EmbedProvider } = {
    "mp4upload.com": {name: "Mp4Upload"},
    "embed.mystream.to": {name: "MyStream"},
    "www.rapidvideo.com": {name: "RapidVideo"},
    "stream.moe": {name: "StreamMoe"},
};

export default embedProvider;