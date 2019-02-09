import AsyncLock from "dolos/lock";

test("basic lock", async () => {
    const lock = new AsyncLock();

    expect(lock.isLocked()).toBeFalsy();

    await lock.acquire();
    expect(lock.isLocked()).toBeTruthy();
    lock.release();
    expect(lock.isLocked()).toBeFalsy();
});

test("namespaced lock", async () => {
    const lock = new AsyncLock();

    const keys = ["a", {a: "b"}, 15];

    expect(lock.isLocked(...keys)).toBeFalsy();

    await lock.acquire(...keys);
    expect(lock.isLocked(...keys)).toBeTruthy();
    lock.release(...keys);
    expect(lock.isLocked(...keys)).toBeFalsy();
});

test("lock withLock", async () => {
    const lock = new AsyncLock();

    expect(lock.isLocked()).toBeFalsy();

    const result = await lock.withLock((lock) => {
        expect(lock.isLocked()).toBeTruthy();
        return 16;
    });

    expect(result).toBe(16);

    expect(lock.isLocked()).toBeFalsy();
});

test("lock example", async () => {
    const lock = new AsyncLock();

    const out: string[] = [];

    async function write(text: string, key: string, delay?: number): Promise<void> {
        await lock.withLock(async () => {
            await new Promise(res => setTimeout(res, 50 + (delay || 0)));
            out.push(text);
        }, key);
    }

    await Promise.all([
        write("this", "a"),
        write("is", "a"),
        write("me", "a", 10),
        write("cute", "b"),
        write("not", "b"),
        write("loyal", "b"),
        write("dog", "c"),
        write("very", "c"),
        write("to", "c"),
    ]);

    expect(out.join(" ")).toEqual("this cute dog is not very loyal to me");
});
