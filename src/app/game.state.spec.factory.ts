import {
    GameState,
    Player,
    GameStatus,
} from "./tickTackToeGame/tick-tack-toe-state-machine";

const gameStateFactory = (partial: Partial<GameState> = {}): GameState => {
    const defaultGameState: GameState = {
        gameStatus: GameStatus.PLAYING,
        turn: Player.X,
        oMoves: [],
        oScore: {
            column: {},
            row: {},
            sameDiagonalCount: 0,
            oppositeDiagonalCount: 0,
        },
        xMoves: [],
        xScore: {
            column: {},
            row: {},
            sameDiagonalCount: 0,
            oppositeDiagonalCount: 0,
        },
    };

    return Object.assign({}, defaultGameState, partial);
};

export { gameStateFactory };
