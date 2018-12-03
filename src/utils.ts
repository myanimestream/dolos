export async function artificialDelay(delay: number, ...waiting: Promise<any>[]): Promise<void> {
    const timeout = new Promise(res => setTimeout(res, delay));
    waiting.push(timeout);

    await Promise.all(waiting);
}