import { Component, OnInit } from '@angular/core';
import {
    TickTackToeStateMachine,
    GameState,
    Player,
    Coordinate,
    GameStatus,
    BoardRange,
} from "./tickTackToeGame/tick-tack-toe-state-machine";
import * as R from 'ramda';
import { map } from "rxjs/operators";

type None = "None";
type Selection = Player | None;

const minus1: BoardRange = -1;
interface Row {
    [minus1]: Selection;
    0: Selection;
    1: Selection;
}
interface Board {
    [minus1]: Row;
    0: Row;
    1: Row;
}
interface DisplayGameState {
    board: Board;
    activePlayer: Player;
    displayStatus: string;
    resetable: boolean;
}

const initialRow = (): Row => ({
    [minus1]: "None",
    0: "None",
    1: "None",
});
const initialBoard = (): Board => ({
    [minus1]: initialRow(),
    0: initialRow(),
    1: initialRow()
});

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
class AppComponent implements OnInit {
    title = 'demonstrationApp';
    activePlayer: Player = Player.NONE;
    board: Board = initialBoard();
    displayStatus: string = "";
    entries: BoardRange[] = [-1, 0, 1];
    resetable: boolean = false;

    constructor(private tickTackToeMachine: TickTackToeStateMachine) { }

    ngOnInit() {
        this.tickTackToeMachine.getObservable().pipe(
            map((gameState: GameState): DisplayGameState => {
                const board = this.convertGameStateToBoard(gameState);
                return {
                    board,
                    activePlayer: gameState.turn,
                    displayStatus: this.convertToDisplayStatus(gameState.gameStatus),
                    resetable: this.isResetable(gameState.gameStatus)
                };
            })
        ).subscribe((displayGameState: DisplayGameState) => {
            this.board = displayGameState.board;
            this.activePlayer = displayGameState.activePlayer;
            this.displayStatus = displayGameState.displayStatus;
            this.resetable = displayGameState.resetable;
        });
    }

    private convertToDisplayStatus(status: GameStatus): string {
        const displayStatusMap: { [key in GameStatus]: string } = {
            [GameStatus.DRAW]: "Tie",
            [GameStatus.PLAYING]: "",
            [GameStatus.O_WIN]: "O Won",
            [GameStatus.X_WIN]: "X Won",
        };

        return displayStatusMap[status];
    };

    private convertGameStateToBoard(gameState: GameState): Board {
        const board: Board = initialBoard();

        gameState.xMoves.forEach((move: Coordinate) => {
            board[move.x][move.y] = Player.X;
        });
        gameState.oMoves.forEach((move: Coordinate) => {
            board[move.x][move.y] = Player.O;
        });

        return board;
    }

    private isResetable(gameStatus: GameStatus): boolean {
        return gameStatus !== GameStatus.PLAYING;
    }

    updatePlayer(coordinate: Coordinate) {
        this.board[coordinate.x][coordinate.y] = this.activePlayer;

        if (this.activePlayer === Player.O) {
            this.activePlayer = Player.X;
        } else {
            this.activePlayer = Player.O;
        }
    }

    getSymbol(coordinate: Coordinate): string {
        const symbol = this.board[coordinate.x][coordinate.y];

        if (symbol === "None") {
            return "";
        } else {
            return symbol;
        }
    }
}

export {
    AppComponent,
    Coordinate
};
