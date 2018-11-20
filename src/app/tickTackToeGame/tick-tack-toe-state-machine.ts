import { Injectable } from "@angular/core";
import { Subject, BehaviorSubject, Observable } from "rxjs";
import * as _ from "lodash";

enum Player {
    X = "X",
    O = "O",
    NONE = "NONE",
}
enum EventType {
    PLAYER_MOVE = "PLAYER_MOVE",
    RESET = "RESET",
}
enum GameStatus {
    PLAYING = "PLAYING",
    X_WIN = "X_WIN",
    O_WIN = "O_WIN",
    DRAW = "DRAW",
}
type BoardRange = -1 | 0 | 1;

interface Coordinate {
    x: BoardRange;
    y: BoardRange;
}
interface PlayerMove {
    eventType: EventType.PLAYER_MOVE;
    data: Coordinate;
}
interface ResetEvent {
    eventType: EventType.RESET;
}
type GameEvent = PlayerMove | ResetEvent;

interface Score {
    column: { [key: number]: number };
    row: { [key: number]: number };
    sameDiagonalCount: number;
    oppositeDiagonalCount: number;
}
interface GameState {
    turn: Player;
    gameStatus: GameStatus;
    xMoves: Coordinate[];
    oMoves: Coordinate[];
    xScore: Score;
    oScore: Score;
}

const initialGameState: () => GameState = () => ({
    turn: Player.X,
    gameStatus: GameStatus.PLAYING,
    xMoves: [],
    oMoves: [],
    xScore: { row: {}, column: {}, sameDiagonalCount: 0, oppositeDiagonalCount: 0 },
    oScore: { row: {}, column: {}, sameDiagonalCount: 0, oppositeDiagonalCount: 0 },
});

const nextPlayer = (player: Player): Player => {
    if (player === Player.X) {
        return Player.O;
    }
    return Player.X;
};

const updateScore = ({ x, y }: Coordinate, score: Score): Score => {
    const incrementUpdateMap = (map: { [key: number]: number }, key: number) => {
        const result = { ...map };
        result[key] = _.get(map, key, 0) + 1;

        return result;
    }

    let sameDiagonalCount: number = score.sameDiagonalCount;
    let oppositeDiagonalCount: number = score.oppositeDiagonalCount;

    if (x === y) {
        sameDiagonalCount = sameDiagonalCount + 1;
    }
    if (x === y * -1) {
        oppositeDiagonalCount = oppositeDiagonalCount + 1;
    }

    return {
        sameDiagonalCount,
        oppositeDiagonalCount,
        row: incrementUpdateMap(score.row, y),
        column: incrementUpdateMap(score.column, x),
    };
};

const is3 = (v: number): boolean => v === 3;

const isAWinner = ({ column, row, sameDiagonalCount, oppositeDiagonalCount }: Score): boolean => {
    const columnCounts: number[] = Object.values(column);
    const rowCounts: number[] = Object.values(row);

    return (
        _.some(columnCounts, is3) ||
        _.some(rowCounts, is3) ||
        is3(sameDiagonalCount) ||
        is3(oppositeDiagonalCount)
    );
};

const updateGameState = (gameState: GameState) => (gameEvent: GameEvent): GameState => {
    if (gameEvent.eventType === EventType.PLAYER_MOVE) {
        const moveToApply: Coordinate = gameEvent.data;
        const equalCoordinates = (c1: Coordinate, c2: Coordinate): boolean => c1.x === c2.x && c1.y === c2.y;
        const allMoves: Coordinate[] = _.concat(gameState.xMoves, gameState.oMoves);

        if (gameState.gameStatus === GameStatus.X_WIN) {
            return gameState;
        }
        if (gameState.gameStatus === GameStatus.O_WIN) {
            return gameState;
        }

        if (_.some(allMoves, (move: Coordinate) => equalCoordinates(move, moveToApply))) {
            return gameState;
        }

        let xMoves: Coordinate[];
        let oMoves: Coordinate[];

        let xScore: Score;
        let oScore: Score;

        let gameStatus: GameStatus = GameStatus.PLAYING;

        if (gameState.turn === Player.X) {
            oMoves = [...gameState.oMoves];
            oScore = { ...gameState.oScore };

            xMoves = [...gameState.xMoves, gameEvent.data];
            xScore = updateScore(gameEvent.data, { ...gameState.xScore });

            gameStatus = isAWinner(xScore) ? GameStatus.X_WIN : gameStatus;
        } else {
            oMoves = [...gameState.oMoves, gameEvent.data];
            oScore = updateScore(gameEvent.data, { ...gameState.oScore });

            xMoves = [...gameState.xMoves];
            xScore = { ...gameState.xScore };

            gameStatus = isAWinner(oScore) ? GameStatus.O_WIN : gameStatus;
        }

        if (gameStatus === GameStatus.PLAYING) {
            if (xMoves.length + oMoves.length === 9) {
                gameStatus = GameStatus.DRAW;
            }
        }

        return {
            turn: nextPlayer(gameState.turn),
            gameStatus,
            xMoves,
            xScore,
            oMoves,
            oScore,
        };
    } else if (gameEvent.eventType === EventType.RESET) {
        return initialGameState();
    } else {
        return gameState;
    }
}

@Injectable({
    providedIn: 'root'
})
class TickTackToeStateMachine {

    private gameEventPublisher: Subject<GameEvent>;
    private gameStateObservable: Observable<GameState>;
    private gameStateSubject: Subject<GameState>;
    private gameState: GameState;

    constructor() {
        this.gameState = initialGameState();
        this.gameStateSubject = new BehaviorSubject<GameState>(this.gameState);
        this.gameStateObservable = this.gameStateSubject.asObservable();
        this.gameEventPublisher = new Subject<GameEvent>();

        this.gameEventPublisher.asObservable().subscribe((gameEvent: GameEvent) => {
            this.gameState = updateGameState(this.gameState)(gameEvent);

            this.gameStateSubject.next(this.gameState);
        })
    }

    getPublisher(): Subject<GameEvent> {
        return this.gameEventPublisher;
    }

    getObservable(): Observable<GameState> {
        return this.gameStateObservable;
    }
}

export {
    TickTackToeStateMachine,
    GameState,
    GameEvent,
    PlayerMove,
    Player,
    EventType,
    Coordinate,
    GameStatus,
    BoardRange,
};
