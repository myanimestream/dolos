export async function artificialDelay<T>(delay: number, ...waiting: Promise<T>[]): Promise<T[]> {
    const timeout = new Promise(res => setTimeout(res, delay)) as Promise<T>;
    waiting.push(timeout);

    const res = await Promise.all(waiting);
    return res.slice(0, res.length - 1)
}

export interface Type<T> extends Function {
    new(...args: any[]): T;
}