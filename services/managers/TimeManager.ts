
export class TimeManager {
    public now: number = 0;

    constructor() {
        this.now = 0;
    }

    public sync(realTime: number) {
        this.now = realTime;
    }

    public advance(dt: number) {
        this.now += dt;
    }
}
