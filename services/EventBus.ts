
import { GameEventType } from "../types/events";

type EventHandler<T = any> = (payload: T) => void;

export class EventBus {
    private listeners: Map<GameEventType, EventHandler[]> = new Map();

    public on<T>(event: GameEventType, handler: EventHandler<T>): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(handler);
    }

    public off<T>(event: GameEventType, handler: EventHandler<T>): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    public emit<T>(event: GameEventType, payload: T): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(payload));
        }
    }

    public clear(): void {
        this.listeners.clear();
    }
}
