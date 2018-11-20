import {
    TickTackToeStateMachine,
    Player,
    GameState,
    GameEvent,
    EventType,
    Coordinate,
    GameStatus,
    BoardRange,
} from "./tickTackToeGame/tick-tack-toe-state-machine";

const playerMoveGameEventFactory = (partial: Partial<GameEvent>): GameEvent => {
    const defaultGameEvent: GameEvent = {
        eventType: EventType.PLAYER_MOVE,
        data: {
            x: 0,
            y: 0,
        }
    }

    return Object.assign({}, defaultGameEvent, partial);
};

export {
    playerMoveGameEventFactory
}
