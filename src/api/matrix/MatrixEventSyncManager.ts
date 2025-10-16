import type MatrixClientApi from "./MatrixClientApi";

type EventHandler = (event: any) => void;

export class MatrixEventSyncManager {
  private api: MatrixClientApi;
  private handlers: Record<string, EventHandler[]> = {};
  private syncToken?: string;
  private isRunning = false;

  constructor(api: MatrixClientApi) {
    this.api = api;
  }

  on(eventType: string, handler: EventHandler) {
    if (!this.handlers[eventType]) this.handlers[eventType] = [];
    this.handlers[eventType].push(handler);
    console.info(`handler[${eventType}] new size: ${this.handlers[eventType].length}`)
  }

  off(eventType: string, handler: EventHandler) {
    this.handlers[eventType] = (this.handlers[eventType] || []).filter(h => h !== handler);
    console.info(`handler[${eventType}] new size: ${this.handlers[eventType].length}`)
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    await this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  private async loop() {
    while (this.isRunning) {
      try {
        const data = await this.api.sync(this.syncToken);
        this.syncToken = data.next_batch;

        const rooms = data.rooms?.join || {};
        for (const roomId in rooms) {
          if (this.api.RoomId === roomId) {
            const events = rooms[roomId].timeline?.events || [];
            for (const event of events) {
              const handlers = this.handlers[event.type] || [];
              handlers.forEach(h => h(event));
            }
          }
        }
      } catch (err) {
        console.error("Sync error:", err);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}
