export class Lerp {

    current: number = 0;
    target: number = 0;

    /**
     * the amount of time (milliseconds) it
     * takes to get halfway to the target
     * */
    halfLife: number = 100;

    constructor(halfLife?: number) {
        if (halfLife !== undefined) {
            this.halfLife = halfLife
        }
    }

    step(deltaMS: DOMHighResTimeStamp): number {
        if (this.halfLife <= 0) {
            this.current = this.target;
        }
        else {
            const lerp = Math.min(1, 0.5 * deltaMS / this.halfLife);
            this.current += (this.target - this.current) * lerp;
        }
        return this.current;
    }

    isAtRest(): boolean {
        const tolerance = 0.1;
        return Math.abs(this.target - this.current) < tolerance;
    }

    reset(current: number = 0): void {
        this.current = this.target = current;
    }

    fastForward() {
        this.current = this.target;
    }
}